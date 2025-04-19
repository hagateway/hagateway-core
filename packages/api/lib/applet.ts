import { oc } from "@orpc/contract";
// import { eventIterator } from "@orpc/server";
import { z } from "zod";


export const AppletStateSchema = z.enum([
    "running", 
    "stopping", 
    "dead",
]);

export const AppletManagerAPIContract = {
    info: oc.output(
        z.object({
            version: z.literal(0),
        })
    ),
    instance: {
        create: oc.input(z.object({
            ref: z.string().optional(),
        })),
        destroy: oc.input(z.object({
            ref: z.string().optional(),
        })),   
        // subscribe: {
        //     statechange: oc.output(
        //         eventIterator(
        //             z.object({
        //                 ref: z.string(),
        //                 state: AppletStateSchema,
        //             })
        //         )
        //     ),
        // },     
    },
};