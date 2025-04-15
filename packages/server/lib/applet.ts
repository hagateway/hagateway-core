import Express from "express";


export interface AppletSpec {
    baseUrl: string;
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
    (ref: string, context: AppletSpawnerContext): Promise<void>;
    onRequest?: Express.RequestHandler;
}

// TODO filesystem like interface
export interface IAppletManager {
    // TODO
    use(spawner: IAppletSpawner): IAppletManager;

    create(ref: string | null, spec: AppletSpec): Promise<string>;
    destroy(ref: string): Promise<void>;
    // TODO
    //query?(ref: string): Promise<AppletSpec>;

    refs(): AsyncIterator<string>;

    has(ref: string): Promise<boolean>;

    serve?(ref: string): Promise<Express.RequestHandler>;
}

import { ISessionManager } from "./session";

import { implement } from "@orpc/server";
import { AppletManagerAPIContract } from "@wagateway/api/lib/applet";


export function AppletManagerAPIImpl(
    config: { 
        sessionManager: ISessionManager;
        appletManager: IAppletManager; 
    }
) {
    // TODO
    const os = implement(AppletManagerAPIContract)
        .$context<{ req: Express.Request }>();

    return os.router({
        info: os.info.handler(() => {
            return {
                version: 0,
            };
        }),
        // TODO
        instance: {
            create: os.instance.create.handler(
                async ({ input }) => {
                    if (input.ref != null)
                        throw new Error("TODO ref not supported");
                    throw new Error("TODO not implemented");
                }
            ),
            destroy: os.instance.destroy.handler(
                async ({ input, context }) => {
                    if (input.ref != null)
                        throw new Error("TODO ref not supported");

                    // TODO
                    const sessionData 
                        = await config.sessionManager.query(context.req);
                    if (sessionData == null)
                        throw new Error("Session not found");

                    if (sessionData.appletRef == null)
                        throw new Error("Applet not found");
                    await config.appletManager.destroy(sessionData.appletRef);
                }
            ),
            // subscribe: {
            //     statechange: os.instance.subscribe.statechange.handler(async () => {
            //         // TODO
            //         return {};
            //     }),
            // },
        }
    });
}
