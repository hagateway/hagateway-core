import * as Fs from "node:fs/promises";
import * as ChildProcess from "node:child_process";
import * as Util from "node:util";
const spawnAsync = Util.promisify(ChildProcess.spawn);


export interface BootstrapConfig {
    prefix: string;
}

export async function bootstrap(config: BootstrapConfig) {
    await Fs.mkdir(config.prefix, { mode: 0o700, recursive: true });

    for (const [executable, args] of [
        ["npm", ["init", "--prefix", config.prefix]],
        ["npm", [
            "install", "--prefix", config.prefix, 
            "--save", 
            "@hagateway/server",
            "@hagateway/serverkit-linux",
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
