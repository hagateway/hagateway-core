import Path from "node:path";
import { mkdir, copyFile } from "node:fs/promises";

import ESBuild from "esbuild";


const tasks = {
    "src": async function buildLibFrontend() {
        await mkdir(Path.resolve("dist/src"), { recursive: true });

        await copyFile(
            Path.resolve("src/index.ejs"),
            Path.resolve("dist/src/index.ejs"),
        );

        await ESBuild.build({
            // TODO
            entryPoints: ["src/index.tsx"],
            //
            bundle: true,
            outdir: Path.resolve("dist/src"),
            platform: "browser",
            format: "esm",
            jsx: "automatic",
            minify: true,
            entryNames: "index",
            // TODO
            assetNames: "assets/[name]-[hash]",
            loader: {
                ".ts": "ts",
                ".tsx": "tsx",
                ".css": "css",
                ".svg": "file",
                ".png": "file",
                ".jpg": "file",
                ".woff": "file",
                ".woff2": "file",
            },
        });
    },
};

async function build() {
    for (const [taskName, task] of Object.entries(tasks)) {
        console.log(`Building ${taskName}...`);
        await task();
    }
}

build();