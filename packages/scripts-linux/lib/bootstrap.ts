import * as Path from "node:path";
import * as Fs from "node:fs";
import * as ChildProcess from "node:child_process";
import * as Util from "node:util";
const spawnAsync = Util.promisify(ChildProcess.spawn);


export interface BootstrapConfig {
    prefix: string;
}

export async function bootstrap(config: BootstrapConfig) {
    await Fs.promises.mkdir(config.prefix, { mode: 0o700, recursive: true });

    try {
        const f = await Fs.promises.open(
            Path.join(config.prefix, "package.json"), 
            "wx", // 'w' = write, 'x' = exclusive (fail if exists)
        );
        await f.writeFile(
            JSON.stringify({}, null, 2), 
            { encoding: "utf8" },
        );
        await f.close();
    } catch (error: any) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST")
            throw new Error("Failed to create package.json", { cause: error });
    }

    for (const [executable, args] of [
        ["npm", [
            "install", "--prefix", config.prefix,
            "--save",
            "@hagateway/server",
            "@hagateway/serverkit-linux",
            "@hagateway/clientkit",
        ]],
    ] satisfies [string, string[]][]) {
        await spawnAsync(
            executable, args,
            { stdio: "inherit" },
        );
    }
}


import Yargs from "yargs";

export const bootstrapCommand = {
    command: "bootstrap",
    describe: "Bootstrap a hagateway deployment directory",
    aliases: ["install"],
    builder(yargs) {
        return yargs.option("prefix", {
            type: "string",
            describe: "Installation directory",
            default: "/opt/hagateway",
        });
    },
    async handler(argv) {
        await bootstrap({ prefix: argv.prefix });
    },
} satisfies Yargs.CommandModule<{}, BootstrapConfig>;
