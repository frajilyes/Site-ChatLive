import { execFile } from "node:child_process";

export interface ProcessInfo {
  pid: number;
  ppid: number;
  name: string;
  /** Demarrage du processus, en ms depuis l'epoch. 0 quand la date est inconnue. */
  startedAt: number;
}

/** Identite stable d'un processus : le PID seul est recycle par Windows. */
export interface ProcessId {
  pid: number;
  startedAt: number;
}

const MAX_DEPTH = 8;

/** Tolerance d'horloge : « ps » ne donne l'age qu'a la seconde pres. */
const CLOCK_SLACK_MS = 2_000;

const ROOTS =
  /^(system|idle|services|wininit|winlogon|svchost|explorer|smss|csrss|lsass|init|systemd|launchd)$/i;

const WINDOWS_SCRIPT =
  " ForEach-Object {" +
  " $t = 0;" +
  " if ($_.CreationDate) { $t = [long]($_.CreationDate.ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds };" +
  " \"$($_.ProcessId) $($_.ParentProcessId) $t $($_.Name)\" }";

function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      { encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout) => resolve(error ? "" : stdout),
    );
  });
}

/** « 01:12 », « 1:01:12 » ou « 2-01:01:12 » -> age en secondes. */
function parseElapsed(value: string): number {
  const [days, clock] = value.includes("-") ? value.split("-") : ["0", value];
  const parts = clock.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  const [hours, minutes, seconds] = [0, 0, 0, ...parts].slice(-3);
  return (Number(days) || 0) * 86_400 + hours * 3_600 + minutes * 60 + seconds;
}

function parse(output: string, now: number): Map<number, ProcessInfo> {
  const table = new Map<number, ProcessInfo>();

  for (const line of output.split(/\r?\n/)) {
    const [rawPid, rawPpid, rawStart, ...rest] = line.trim().split(/\s+/);
    const pid = Number(rawPid);
    const ppid = Number(rawPpid);
    if (!Number.isInteger(pid) || pid <= 0) continue;
    if (!Number.isInteger(ppid) || ppid < 0) continue;

    const startedAt =
      process.platform === "win32"
        ? Number(rawStart) || 0
        : now - parseElapsed(rawStart ?? "") * 1_000;

    const name = (rest.join(" ") || "inconnu").replace(/\.exe$/i, "");
    table.set(pid, { pid, ppid, name, startedAt: Number.isFinite(startedAt) ? startedAt : 0 });
  }
  return table;
}

export async function processTable(): Promise<Map<number, ProcessInfo>> {
  const output =
    process.platform === "win32"
      ? await run("powershell.exe", [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `Get-CimInstance Win32_Process |${WINDOWS_SCRIPT}`,
        ])
      : await run("/bin/sh", ["-c", "ps -eo pid=,ppid=,etime=,comm="]);

  return parse(output, Date.now());
}

/**
 * Meme chose que processTable() mais limitee a quelques PID : la requete est
 * filtree cote systeme, ce qui la rend assez legere pour un sondage periodique.
 */
export async function processesByPid(pids: readonly number[]): Promise<Map<number, ProcessInfo>> {
  const wanted = [...new Set(pids)].filter((pid) => Number.isInteger(pid) && pid > 0);
  if (wanted.length === 0) return new Map();

  const output =
    process.platform === "win32"
      ? await run("powershell.exe", [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `Get-CimInstance Win32_Process -Filter '${wanted.map((pid) => `ProcessId=${pid}`).join(" OR ")}' |` +
            WINDOWS_SCRIPT,
        ])
      : await run("/bin/sh", ["-c", `ps -o pid=,ppid=,etime=,comm= -p ${wanted.join(",")}`]);

  return parse(output, Date.now());
}

/**
 * Chaine des processus parents, du plus proche au plus lointain.
 *
 * Windows recycle les PID tres vite : un parent demarre apres son enfant n'est
 * pas le vrai parent mais un inconnu qui a herite du numero. On s'arrete la,
 * sinon on surveillerait — et « free-port » tuerait — des processus etrangers.
 */
export function ancestorsOf(pid: number, table: ReadonlyMap<number, ProcessInfo>): ProcessInfo[] {
  const chain: ProcessInfo[] = [];
  const seen = new Set<number>([pid]);
  let current = table.get(pid);

  while (current && chain.length < MAX_DEPTH) {
    const parent = table.get(current.ppid);
    if (!parent || seen.has(parent.pid) || ROOTS.test(parent.name)) break;
    if (parent.startedAt > 0 && current.startedAt > 0) {
      if (parent.startedAt > current.startedAt + CLOCK_SLACK_MS) break;
    }
    chain.push(parent);
    seen.add(parent.pid);
    current = parent;
  }
  return chain;
}

/** Le PID existe-t-il encore ? Ne dit rien de l'identite du processus. */
export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Le processus exact (PID + date de demarrage) tourne-t-il encore ? */
export function isSameProcess(expected: ProcessId, found: ProcessInfo | undefined): boolean {
  if (!found) return false;
  if (expected.startedAt === 0 || found.startedAt === 0) return true;
  return Math.abs(found.startedAt - expected.startedAt) <= CLOCK_SLACK_MS;
}
