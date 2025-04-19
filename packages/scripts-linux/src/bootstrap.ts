import * as Path from "node:path";
import * as Fs from "node:fs/promises";
import * as ChildProcess from "node:child_process";
import * as Util from "node:util";
const spawnAsync = Util.promisify(ChildProcess.spawn);


export interface BootstrapConfig {
    prefix: string;
}

export async function bootstrap(config: BootstrapConfig) {
    await Fs.mkdir(config.prefix, { mode: 0o700, recursive: true });

    // TODO check for existance
    await Fs.writeFile(
        Path.join(config.prefix, "package.json"),
        JSON.stringify({
            "name": "@hagateway/user-deployment",
            "version": "0.0.0",
            "private": true,
            "dependencies": {
                "@hagateway/server": "^0.0.0",
                "@hagateway/scripts-linux": "^0.0.0",
                "@hagateway/serverkit-linux": "^0.0.0",
            },
            "scripts": {
                "start": "@hagateway/server serve",
            },
        }, null, 2),
        { encoding: "utf8" },
    );

    // TODO install
    await spawnAsync(
        "npm",
        ["install", "--prefix", config.prefix],
        { stdio: "inherit" },
    );

}


import Yargs from "yargs";

const command: Yargs.CommandModule<{}, BootstrapConfig> = {
    command: ["bootstrap"],
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
};

export default command;