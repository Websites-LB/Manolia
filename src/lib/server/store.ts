/**
 * Where things are kept. Locally each collection is one JSON file under .data/, which is enough to
 * run every flow on a laptop. A serverless host has no disk to write to, so production needs a
 * database behind these same four functions before the shop goes live.
 */
import { promises as fs } from "fs";
import path from "path";

export const DATA_DIR = path.join(process.cwd(), ".data");

export function collection<T extends { id: string }>(name: string) {
  const file = path.join(DATA_DIR, `${name}.json`);
  // one writer at a time: every change waits for the one before it
  let queue: Promise<unknown> = Promise.resolve();
  const locked = <R>(fn: () => Promise<R>): Promise<R> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  };
  const read = async (): Promise<T[]> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as T[];
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  };
  const write = async (all: T[]) => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2));
    await fs.rename(tmp, file);
  };
  return {
    list: read,
    get: async (id: string) => (await read()).find((x) => x.id === id) ?? null,
    create: (item: T) =>
      locked(async () => {
        const all = await read();
        all.push(item);
        await write(all);
        return item;
      }),
    /** Apply a change to one item. Return null from `change` to leave it as it is. */
    update: (id: string, change: (x: T) => T | null) =>
      locked(async () => {
        const all = await read();
        const i = all.findIndex((x) => x.id === id);
        if (i < 0) return null;
        const next = change(all[i]);
        if (!next) return all[i];
        all[i] = next;
        await write(all);
        return next;
      }),
  };
}
