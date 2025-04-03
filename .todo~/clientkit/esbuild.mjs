import Path from "node:path";
import { mkdir, copyFile } from "node:fs/promises";

import ESBuild from "esbuild";


const tasks = {
    "lib/frontend": async function buildLibFrontend() {
        await mkdir(Path.resolve("dist/lib/frontend/www"), { recursive: true });

        await copyFile(
            Path.resolve("lib/frontend/www/index.ejs"),
            Path.resolve("dist/lib/frontend/www/index.ejs"),
        );

        await ESBuild.build({
            // TODO
            entryPoints: ["lib/frontend/www/index.tsx"],
            //
            // bundle: true,
            outdir: Path.resolve("dist/lib/frontend/www"),
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

        await mkdir(Path.resolve("dist/lib/frontend"), { recursive: true });

        await ESBuild.build({
            entryPoints: ["lib/frontend/config.ts"],
            bundle: true,
            outdir: Path.resolve("dist/lib/frontend"),
            platform: "node",
            format: "esm",
            packages: "external",
            target: "node16",
            sourcemap: true,
            minify: false,
            entryNames: "[name]",
        });
    },
    "lib/backend": async function buildLibBackend() {
        await mkdir(Path.resolve("dist/lib/backend"), { recursive: true });

        await ESBuild.build({
            entryPoints: ["lib/backend/index.ts"],
            // bundle: true,
            outdir: Path.resolve("dist/lib/backend"),
            platform: "node",
            format: "esm",
            packages: "external",
            target: "node16",
            sourcemap: true,
            minify: false,
            entryNames: "[name]",
        });
    },
    "src": async function buildSrc() {
        await mkdir(Path.resolve("dist/src"), { recursive: true });

        await ESBuild.build({
            entryPoints: ["src/index.ts"],
            // bundle: true,
            outdir: Path.resolve("dist/src"),
            platform: "node",
            format: "esm",
            packages: "external",
            target: "node16",
            sourcemap: true,
            minify: false,
            entryNames: "[name]",
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