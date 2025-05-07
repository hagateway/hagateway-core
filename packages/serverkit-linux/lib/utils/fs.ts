import Fs from "node:fs";
import Path from "node:path";


export async function waitForFile(
    filePath: string, 
    options?: { signal?: AbortSignal },
): Promise<void> {
    try {
        await Fs.promises.access(filePath, Fs.constants.F_OK);
        return;
    } catch {}

    const fileName = Path.basename(filePath);
    for await (const event of Fs.promises.watch(
        Path.dirname(filePath), 
        { signal: options?.signal },
    )) {
        if (event.eventType === "rename" && event.filename === fileName)
            return;
    }

    throw new Error(`Aborted while waiting for file: ${filePath}`);
}
