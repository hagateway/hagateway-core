import { oc } from "@orpc/contract";
import { eventIterator } from "@orpc/server";
import { z } from "zod";


export const AppletState = z.enum([
    "unknown",
    "up",
    "down",
    "failed",
    "starting",
    "stopping",    
]);
export type AppletState = z.infer<typeof AppletState>;

/**
 * Applet spawner reference.
 * This is a string that identifies the spawner.
 * The default spawner is `null`.
 */
export const AppletSpawnerRef = z.union([
    z.string(),
    z.null(),
]);
export type AppletSpawnerRef = z.infer<typeof AppletSpawnerRef>;

export const AppletSpawnerInfo = z.object({
    ref: AppletSpawnerRef,
    displayName: z.string(),
    displayIcon: z.string().url().optional(),
    description: z.string().optional(),
});
export type AppletSpawnerInfo = z.infer<typeof AppletSpawnerInfo>;

export const AppletManagerAPIContract = {
    info: oc.output(
        z.object({
            version: z.literal(0),
            spawner: AppletSpawnerInfo,
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