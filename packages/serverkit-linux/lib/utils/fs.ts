import Fs from "node:fs";


export async function waitForFile(
    filePath: string,
    options?: {
        signal?: AbortSignal;
    },
): Promise<void> {
    try {
        await Fs.promises.access(
            filePath,
            Fs.constants.F_OK,
        );
        return;
    } catch { }

    return new Promise<void>((resolve, reject) => {
        const { signal } = options ?? {};
        if (signal?.aborted) {
            return reject();
        }

        const watcher = (curr: Fs.Stats) => {
            if (curr.nlink > 0) {
                Fs.unwatchFile(filePath, watcher);
                signal?.removeEventListener("abort", abortHandler);
                resolve();
            }
        };
        const abortHandler = () => {
            Fs.unwatchFile(filePath, watcher);
            signal?.removeEventListener("abort", abortHandler);
            reject();
        };        
        Fs.watchFile(filePath, { interval: 0 }, watcher);
        signal?.addEventListener("abort", abortHandler);
    });
}
