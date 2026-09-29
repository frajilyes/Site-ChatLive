import { env } from "../config/env";

import { execFileSync } from "node:child_process";
import net from "node:net";

import { type ProcessInfo, ancestorsOf, processTable } from "../Utils/processTree";

const PORT = env.PORT;

const OURS = /^(node|tsx)/i;

const SUPERVISORS = /^(node|tsx|npm|cmd|sh)$/i;

type Listener = { pid: number; name: string };

function run(command: string, args: string[]): string {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function findListeners(port: number): Listener[] {
  const output =
    process.platform === "win32"
      ? run("powershell.exe", [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue |` +
            " Select-Object -ExpandProperty OwningProcess -Unique |" +
            " ForEach-Object { \"$_ \" + (Get-Process -Id $_ -ErrorAction SilentlyContinue).ProcessName }",
        ])
      : run("/bin/sh", ["-c", `lsof -tiTCP:${port} -sTCP:LISTEN | while read p; do echo "$p $(ps -p $p -o comm=)"; done`]);

  const listeners = new Map<number, string>();
  for (const line of output.split(/\r?\n/)) {
    const [rawPid, ...rest] = line.trim().split(/\s+/);
    const pid = Number(rawPid);
    if (!Number.isInteger(pid) || pid <= 0) continue;
    listeners.set(pid, rest.join(" ") || "inconnu");
  }
  return [...listeners].map(([pid, name]) => ({ pid, name }));
}

async function groupOf(listeners: readonly Listener[]): Promise<ProcessInfo[]> {
  const table = await processTable();
  const own = new Set([process.pid, ...ancestorsOf(process.pid, table).map(({ pid }) => pid)]);
  const group = new Map<number, ProcessInfo>();

  for (const listener of listeners) {
    const chain = [table.get(listener.pid) ?? { pid: listener.pid, ppid: 0, name: listener.name, startedAt: 0 }];
    for (const parent of ancestorsOf(listener.pid, table)) {
      if (own.has(parent.pid) || !SUPERVISORS.test(parent.name)) break;
      chain.unshift(parent);
    }
    for (const parent of chain) group.set(parent.pid, parent);
  }
  return [...group.values()];
}

function kill(pid: number): void {
  if (process.platform === "win32") {
    run("taskkill.exe", ["/PID", String(pid), "/T", "/F"]);
    return;
  }
  run("/bin/sh", ["-c", `kill -TERM ${pid} 2>/dev/null; sleep 1; kill -KILL ${pid} 2>/dev/null; true`]);
}

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => probe.close(() => resolve(true)))
      .listen(port, "0.0.0.0");
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const listeners = findListeners(PORT);
  if (listeners.length === 0) return;

  const foreign = listeners.filter(({ name }) => !OURS.test(name));
  if (foreign.length > 0) {
    const details = foreign.map(({ pid, name }) => `${name} (PID ${pid})`).join(", ");
    console.error(
      `Le port ${PORT} est tenu par un programme qui n'est pas le serveur du projet : ${details}.\n` +
        `Fermez ce programme, ou changez PORT dans le .env (et VITE_API_URL cote front).`,
    );
    process.exit(1);
  }

  const held = new Set(listeners.map(({ pid }) => pid));
  const group = await groupOf(listeners);

  const servers = group.filter(({ pid }) => held.has(pid));
  const watchers = group.filter(({ pid }) => !held.has(pid));

  for (const { pid, name } of servers) {
    console.log(`Port ${PORT} : arret du serveur precedent (${name}, PID ${pid}).`);
  }
  if (watchers.length > 0) {
    const details = watchers.map(({ pid, name }) => `${name} (PID ${pid})`).join(", ");
    console.log(`Arret aussi du lanceur reste ouvert au-dessus : ${details}.`);
  }

  for (const { pid } of group) kill(pid);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await isFree(PORT)) return;
    await wait(150);
  }

  console.error(`Le port ${PORT} est reste occupe malgre l'arret du processus precedent.`);
  process.exit(1);
}

void main();
