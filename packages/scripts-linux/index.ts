#!/usr/bin/env node

import Process from "node:process";

import Yargs from "yargs";
import * as YargsHelper from "yargs/helpers";

Yargs()
    .commandDir("src", {
        recurse: false,
    })
    .demandCommand()
    .strict()
    .recommendCommands()
    .help()
    .parse(YargsHelper.hideBin(Process.argv));