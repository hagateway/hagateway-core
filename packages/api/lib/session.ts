import { oc } from "@orpc/contract";
import { z } from "zod";


export const SessionManagerAPIContract = {
    info: oc.output(
        z.object({
            version: z.literal(0),
        })
    ),
    instance: {
        destroy: oc.input(z.object({})),
    },
};