import {
  type ProcessInfo,
  ancestorsOf,
  isAlive,
  isSameProcess,
  processTable,
  processesByPid,
} from "../Utils/processTree";

/** Sondage courant : un signal 0 par ancetre, sans lancer de processus. */
const CHECK_MS = 2_000;

/** Relecture des dates de demarrage : detecte un PID libere puis recycle. */
const VERIFY_MS = 60_000;

function terminate(pid: number): void {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }
}

/**
 * Arrete le serveur des que le terminal qui l'a lance disparait.
 *
 * Windows ne nettoie pas les arbres de processus : si la fenetre est tuee sans
 * passer par Ctrl+C, npm, cmd, tsx et le serveur survivent et gardent le port.
 * On surveille donc la chaine des parents, et on entraine dans notre chute les
 * intermediaires restes entre le lanceur mort et nous.
 */
export function watchLauncher(onOrphan: (launcher: string) => void): void {
  void processTable().then((table) => {
    const chain: ProcessInfo[] = ancestorsOf(process.pid, table).filter(({ pid }) => isAlive(pid));

    // Lancement detache : la chaine est illisible, il reste au moins le parent direct.
    if (chain.length === 0) {
      const parent = table.get(process.ppid);
      if (parent && isAlive(parent.pid)) chain.push(parent);
    }

    if (chain.length === 0) {
      console.warn(
        "Aucun lanceur identifie : ce serveur ne s'arretera pas tout seul. " +
          "Terminez-le par Ctrl+C, ou par « npm run free-port ».",
      );
      return;
    }

    let timer: NodeJS.Timeout;
    let fired = false;

    function fire(gone: number): void {
      if (fired) return;
      fired = true;
      clearInterval(timer);

      const { pid, name } = chain[gone];
      onOrphan(`${name}, PID ${pid}`);
      for (const stranded of chain.slice(0, gone)) terminate(stranded.pid);
    }

    let verifiedAt = Date.now();

    timer = setInterval(() => {
      const gone = chain.findIndex(({ pid }) => !isAlive(pid));
      if (gone >= 0) {
        fire(gone);
        return;
      }

      if (Date.now() - verifiedAt < VERIFY_MS) return;
      verifiedAt = Date.now();

      void processesByPid(chain.map(({ pid }) => pid)).then((found) => {
        // Requete en echec : on ne conclut rien plutot que de croire tout mort.
        if (fired || found.size === 0) return;
        const recycled = chain.findIndex((parent) => !isSameProcess(parent, found.get(parent.pid)));
        if (recycled >= 0) fire(recycled);
      });
    }, CHECK_MS);
    timer.unref();
  });
}

export default watchLauncher;
