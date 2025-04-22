import { oc } from "@orpc/contract";
import { z } from "zod";


export const SessionData = z.object({
    user: z.string(),
});

export const SessionManagerAPIContract = {
    info: oc.output(
        z.object({
            version: z.literal(0),
        })
    ),
    instance: {
        has: oc.input(z.object({}))
            .output(z.boolean()),
        query: oc.input(z.object({}))
            .output(z.union([SessionData, z.null()])),
        destroy: oc.input(z.object({})),
    },
};