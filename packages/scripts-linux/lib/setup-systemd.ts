import * as Path from "node:path";
import * as Fs from "node:fs/promises";

import * as Ini from "ini";


export interface SetupSystemdConfig {
    prefix: string;
    systemdUnitDirectory?: string;
    force?: boolean;
}

export async function setupSystemd(config: SetupSystemdConfig) {
    const {
        prefix,
        systemdUnitDirectory = "/etc/systemd/system",
        force = false,
    } = config;

    try {
        const f = await Fs.open(
            Path.join(systemdUnitDirectory, "hagateway@.service"), 
            force ? "w" : "wx", // 'w' = write, 'x' = exclusive (fail if exists)
        );
        await f.writeFile(
            Ini.encode({
                Unit: {
                    Description: "hagateway Instance - %i",
                    Wants: "network-online.target",
                    After: "network.target network-online.target",
                },
                Service: {
                    Type: "simple",
                    WorkingDirectory: Path.resolve(prefix),
                    RuntimeDirectory: "hagateway/%i",
                    ExecStart: `npx @hagateway/server serve '${JSON.stringify({
                        // TODO
                        context: { runtimeDirectory: "${RUNTIME_DIRECTORY}" },
                        include: "./instances/%i",
                    })}'`,
                    // Restart: "always",
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
        await f.close();
    } catch (error: any) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST")
            throw new Error("The service has already been set up", { cause: error });
    }
}


import Yargs from "yargs";


export const setupSystemdCommand = {
    command: "setup-systemd",
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
            .option("force", {
                type: "boolean",
                describe: "Overwrite existing file(s)",
                default: false,
            });
    },
    async handler(argv) {
        await setupSystemd(argv);
    },
} satisfies Yargs.CommandModule<{}, SetupSystemdConfig>;
