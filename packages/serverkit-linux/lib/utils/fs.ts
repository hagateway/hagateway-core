import Fs from "node:fs";
import Path from "node:path";


export async function findClosestExistingDir(path: string)
: Promise<string> {
    const dir = Path.dirname(Path.resolve(path));

    try {
        const stat = await Fs.promises.stat(dir);
        if (stat.isDirectory())
            return dir;
    } catch { }

    return findClosestExistingDir(dir);
}

export async function isAccessible(path: string) {
    try {
        await Fs.promises.access(
            path,
            Fs.constants.F_OK,
        );
        return true;
    } catch { }
    
    return false;
}

export async function waitForFile(
    filePath: string,
    options?: {
        basePath?: string,
        signal?: AbortSignal,
    },
): Promise<void> {
    if (await isAccessible(
        Path.resolve(options?.basePath ?? "", filePath)
    )) {
        return;
    }

    var basePath = options?.basePath;
    if (basePath == null) {
        basePath = await findClosestExistingDir(filePath);
        filePath = Path.relative(basePath, filePath);
    }

    for await (const event of Fs.promises.watch(
        basePath,
        {
            signal: options?.signal,
            recursive: true, // TODO: Check if this is needed
        },
    )) {
        if (event.eventType !== "rename")
            continue;

        // NOTE `filename` is not always guaranteed to be provided
        if (event.filename == null) {
            if (await isAccessible(Path.resolve(basePath, filePath)))
                return;
        } else {
            if (event.filename === filePath)
                return;
        }
    }

    throw new Error(`Aborted while waiting for file: ${filePath}`);
}
