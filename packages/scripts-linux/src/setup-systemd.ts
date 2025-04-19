import * as Path from "node:path";
import * as Fs from "node:fs/promises";

import * as Ini from "ini";


export interface SetupSystemdConfig {
    prefix: string;
    systemdUnitDirectory?: string;
}

export async function setupSystemd(config: SetupSystemdConfig) {
    const {
        // TODO get from current dir!!!!!
        prefix, //= "/opt/hagateway",
        systemdUnitDirectory = "/etc/systemd/system",
    } = config;

    await Fs.writeFile(
        Path.join(systemdUnitDirectory, "hagateway@.service"),
        Ini.encode({
            Unit: {
                Description: "hagateway Instance - %i",
                After: "network.target",
            },
            Service: {
                Type: "simple",
                WorkingDirectory: Path.resolve(prefix),
                RuntimeDirectory: "hagateway/%i",
                ExecStart: `npm start -- '${JSON.stringify({
                    // TODO
                    include: "./instances/%i",
                    context: { runtimeDirectory: "${RUNTIME_DIRECTORY}" },
                })}'`,
                Restart: "always",
                User: "root",
                // TODO
                // Environment: "NODE_ENV=production",
            },
            Install: {
                WantedBy: "multi-user.target",
            },
        }, { section: "" }),
        { encoding: "utf8" },
    );
}


import Yargs from "yargs";


const command: Yargs.CommandModule<{}, SetupSystemdConfig> = {
    command: "systemd",
    describe: "Generate hagateway@.service unit for systemd",
    builder(yargs) {
        return yargs
            .option("prefix", {
                type: "string",
                describe: "Installation prefix passed during bootstrapping",
                default: "/opt/hagateway",
            })
            // TODO !!!!!!!!
            .option("systemdUnitDirectory", {
                type: "string",
                describe: "Where to place hagateway@.service",
                default: "/etc/systemd/system",
            })
            .check(async (argv) => {
                const packageConfig = JSON.parse(
                    await Fs.readFile(Path.join(argv.prefix, "package.json"), "utf8")
                );
                // TODO better message!!!!!!!
                if (packageConfig.name !== "@hagateway/user-deployment") {
                    throw new Error(
                        `Invalid "package.json" in ${argv.prefix}: ${packageConfig.name}`
                    );
                }
            });
    },
    async handler(argv) {
        await setupSystemd(argv);
    },
};


export default command;