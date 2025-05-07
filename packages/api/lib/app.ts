import { oc } from "@orpc/contract";
import { z } from "zod";

import { AccountManagerAPIContract } from "./account";
import { AppletManagerAPIContract } from "./applet";
import { AuthAPIContract } from "./auth";
import { SessionManagerAPIContract } from "./session";


export const AppAPIContract = {
    info: oc.input(
        z.object({
            version: z.literal(0),
        })
    ),
    accountManager: AccountManagerAPIContract,
    appletManager: AppletManagerAPIContract,
    auth: AuthAPIContract,
    sessionManager: SessionManagerAPIContract,
};