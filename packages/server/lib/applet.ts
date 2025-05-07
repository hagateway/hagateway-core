import Express from "express";
import { implement } from "@orpc/server";
import { AppletState, AppletManagerAPIContract, AppletSpawnerInfo } from "@hagateway/api/dist/lib/applet";

import { ISessionManager } from "./session";


export interface AppletSpec {
    user: string;
}

export type AppletProxyTransportProtocol = "ip" | "unix";

export interface AppletProxySpec {
    transport: {
        protocol: AppletProxyTransportProtocol;
        host?: string;
        port?: number;
        socketPath?: string;
    };
    protocol?: string;
    hostname?: string;
}

/**
 * The specification for the applet process.
 */
export interface AppletProcessSpec {
    /** Path to the executable. */
    execPath: string;
    /**
     * Arguments to pass to the executable.
     * NOTE: The first argument (`argv[0]`) must be provided!
     */
    execArgv: string[];
    /** Working directory to run the process in. */
    workingDir?: string;
    /** Environment variables to set for the process. */
    env?: Record<string, string>;
}

/**
 * The context object passed to the applet spawner.
 */
export interface AppletSpawnerContext {
    /** Applet specification. */
    spec: AppletSpec;
    // useMiddleware: () => Express.Application;
    /** Proxy hook. */
    useProxy?(hint: Partial<AppletProxySpec>)
        : Promise<AppletProxySpec>;
    /** Process hook. */
    useProcess?(spec: AppletProcessSpec): Promise<AppletProcessSpec>;
}


export interface IAppletSpawner {
    info: AppletSpawnerInfo;
    callback: (ref: string, context: AppletSpawnerContext) => Promise<void>;
    onRequest?: Express.RequestHandler;
}


export interface IAppletManager {
    readonly spawner: IAppletSpawner;
    useSpawner(spawner: IAppletSpawner): IAppletManager;
    
    create(ref: string | null, spec: AppletSpec): Promise<string>;
    destroy(ref: string): Promise<void>;
    // TODO
    //query?(ref: string): Promise<AppletSpec>;
    refs(): AsyncIterator<string>;
    has(ref: string): Promise<boolean>;
    serve?(ref: string): Promise<Express.RequestHandler>;
    // TODO !!!!!
    getState(ref: string): Promise<AppletState>;
    onStateChange(ref: string): AsyncIterable<AppletState>;
}


export function AppletManagerAPIImpl(
    config: { 
        sessionManager: ISessionManager;
        appletManager: IAppletManager; 
    }
) {
    // TODO
    const os = implement(AppletManagerAPIContract)
        .$context<{ req: Express.Request }>();

    const getSessionData = async (context: { req: Express.Request }) => {
        const sessionData 
            = await config.sessionManager.query(context.req);
        if (sessionData == null)
            throw new Error("Session not found");

        return sessionData;
    };

    return os.router({
        info: os.info.handler(() => {
            return {
                version: 0,
                spawner: config.appletManager.spawner.info,
            };
        }),
        // TODO
        instance: {
            create: os.instance.create.handler(
                async ({ input, context }) => {
                    if (input.ref != null)
                        throw new Error("TODO ref not supported");

                    const sessionData = await getSessionData(context);

                    if (sessionData.appletRef == null)
                        throw new Error("Applet ref not found in session");

                    if (await config.appletManager.has(sessionData.appletRef))
                        throw new Error("Applet already exists");

                    await config.appletManager.create(
                        sessionData.appletRef, { 
                            user: sessionData.user, 
                        },
                    );
                }
            ),
            destroy: os.instance.destroy.handler(
                async ({ input, context }) => {
                    if (input.ref != null)
                        throw new Error("TODO ref not supported");

                    // TODO
                    const sessionData = await getSessionData(context);

                    if (sessionData.appletRef == null)
                        throw new Error("Applet ref not specified");
                    try {
                        await config.appletManager.destroy(sessionData.appletRef);
                    } catch (error) {
                        throw new Error("Applet destroy failed", { cause: error });
                    }
                }
            ),
            getState: os.instance.getState.handler(
                async ({ input, context }) => {
                    if (input.ref != null)
                        throw new Error("TODO ref not supported");

                    // TODO
                    const sessionData = await getSessionData(context);

                    if (sessionData.appletRef == null)
                        throw new Error("Applet ref not found");

                    try {
                        return await config.appletManager.getState(sessionData.appletRef);
                    } catch (error) {
                        // TODO !!!!!!!
                        console.error("Error in getState", error);
                        throw new Error("Applet getState failed", { cause: error });
                    }
                }
            ),
            // TODO error handling !!!!!!
            onStateChange: os.instance.onStateChange.handler(
                // TODO
                async function* ({ input, context }) {
                    if (input.ref != null)
                        throw new Error("TODO ref not supported");

                    // TODO
                    const sessionData = await getSessionData(context);

                    if (sessionData.appletRef == null)
                        throw new Error("Applet not found");

                    try {
                        for await (const state of config.appletManager.onStateChange(sessionData.appletRef)) {
                            try {
                                yield state;
                            } catch (error) {
                                // TODO !!!!!!!
                                console.error("Error in onStateChange yield", error);
                            }
                        }
                    } catch (error) {
                        // TODO !!!!!!!
                        console.error("Error in onStateChange", error);
                        // throw error;
                    }
                }
            ),
        }
    });
}
