import { oc } from "@orpc/contract";
import { eventIterator } from "@orpc/server";
import { z } from "zod";


export const AppletState = z.enum([
    "unknown",
    "active",
    "reloading",
    "inactive",
    "failed",
    "activating",
    "deactivating",
]);
export type AppletState = z.infer<typeof AppletState>;

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
        getState: oc.input(z.object({
            ref: z.string().optional(),
        })).output(AppletState),
        onStateChange: oc.input(z.object({
            ref: z.string().optional(),
        })).output(eventIterator(AppletState)),
    },
};