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
import { APIResponseBody } from "./std/api";

// TODO
export function AppletManagerMiddleware(
    config: { 
        sessionManager: ISessionManager;
        appletManager: IAppletManager; 
    }
): Express.RequestHandler {
    const router = Express.Router();

    router.get(
        "/current-applet",
        async (req, res: Express.Response<APIResponseBody | {
            ref: string;
            status: "running" | "stopped";
            // TODO status
        }>) => {
            const sessionData = await config.sessionManager.query(req);
            if (sessionData == null) {
                res.status(404).json({
                    type: "error",
                    message: "Session not found",
                }); // TODO !!!!!!!
                return;
            }
            // TODO interface !!!!!!!
            res.status(204).json({
                type: "data",
                ref: sessionData.appletRef,
                // TODO status
            });
        }
    );

    // TODO confirm
    router.delete(
        "/current-applet",
        async (req, res: Express.Response<APIResponseBody>) => {
            const sessionData = await config.sessionManager.query(req);
            if (sessionData == null) {
                res.status(404).json({
                    type: "error",
                    message: "Session not found",
                });
                return;
            }
            
            if (sessionData.appletRef == null) {
                // TODO
                res.status(404).json({
                    type: "error",
                    message: "Applet not found",
                });
                return;
            }
            await config.appletManager.destroy(sessionData.appletRef);
            res.status(204).json();
        }
    );

    // router.post(
    //     '/applets',
    //     async (_, res: Express.Response<{}>) => {
    //         // TODO
    //         const ref = await config.appletManager.create(null, { user: ... });
    //         res.status(201).json(ref);
    //     },
    // );

    // router.delete(
    //     '/applets/:ref',
    //     async (req: Express.Request, res) => {
    //         // TODO confirm query
    //         //req.query.confirm;
    //         await config.appletManager.destroy(req.params.ref);
    //         res.status(204).end();
    //     },
    // );

    return router;
}
