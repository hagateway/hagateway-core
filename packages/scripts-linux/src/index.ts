#!/usr/bin/env node

import Yargs from "yargs";
import * as YargsHelper from "yargs/helpers";

import { bootstrapCommand } from "../lib/bootstrap";
import { setupSystemdCommand } from "../lib/setup-systemd";


export function CLIMain() {
    const yargs = Yargs()
        .command([bootstrapCommand, setupSystemdCommand])
        .demandCommand()
        .strict()
        .recommendCommands()
        .help();

    return {
        run: async (
            argv: string[] = YargsHelper.hideBin(process.argv),
        ) => {
            await yargs.parse(argv);
        }
    };
}

if (require.main === module) {
    CLIMain().run();
}