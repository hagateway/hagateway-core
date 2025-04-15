import { oc } from "@orpc/contract";
import { z } from "zod";

import { AppletManagerAPIContract } from "./applet";
import { AuthAPIContract } from "./auth";
import { SessionManagerAPIContract } from "./session";


export const AppAPIContract = {
    info: oc.input(
        z.object({
            version: z.literal(0),
        })
    ),
    appletManager: AppletManagerAPIContract,
    auth: AuthAPIContract,
    sessionManager: SessionManagerAPIContract,
};