import { oc } from "@orpc/contract";
import { z } from "zod";


export const AccountManagerAPIContract = {
    info: oc.output(
        z.object({
            version: z.literal(0),
        })
    ),
    user: {
        getDisplayName: oc.input(z.object({
            user: z.string().optional(),
        })).output(z.union([z.string(), z.null()])),
    },
};