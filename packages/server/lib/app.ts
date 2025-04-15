

// TODO
import Http from "http";
import { UpgradeListener } from "http-upgrade-request";


import Express from "express";

import { SessionMiddleware, ISessionManager } from "./session";
import { IAuthManager } from "./auth";
import { IAppletManager } from "./applet";


import * as UUID from "uuid";


import { IView, ViewLocals } from "./view";


export interface AppConfig {
    authManager: IAuthManager;
    sessionManager: ISessionManager;
    appletManager: IAppletManager;
}




import { implement } from "@orpc/server";

import { AppAPIContract } from "@wagateway/api/lib/app";

import { AppletManagerAPIImpl } from "./applet";
import { AuthAPIImpl } from "./auth";
import { SessionManagerAPIImpl } from "./session";
import { RPCHandler } from "@orpc/server/node";


// TODO mv
export function AppAPIImpl(config: AppConfig) {
    const os = implement(AppAPIContract)
        .$context<{ req: Express.Request }>();
    
    return os.router({
        info: os.info.handler(() => {
            return {
                version: 0,
            };
        }),
        appletManager: AppletManagerAPIImpl({
            sessionManager: config.sessionManager,
            appletManager: config.appletManager,
        }),
        auth: AuthAPIImpl({
            authManager: config.authManager,
            onAuthSuccess: async (context) => {
                if (context.result.user == null) {
                    throw new Error("TODO");
                }
                config.sessionManager.create(context.req, { 
                    user: context.result.user, 
                    appletRef: context.result.user,
                });
            },
        }),
        sessionManager: SessionManagerAPIImpl({
            sessionManager: config.sessionManager,
        }),
    });
}


export interface IApp extends Express.Application {
    useApi(path: string): IApp;
    useView(path: string, view: IView): IApp;
    useAppletServing(path: string): IApp;
}

export function App({
    authManager,
    sessionManager,
    appletManager,
}: AppConfig): IApp {
    function getMountPathSingle(app: Express.Application) {
        switch (typeof app.mountpath) {
            case "string":
                return app.mountpath;
            case "object":
                if (Array.isArray(app.mountpath))
                    return app.mountpath[0];
        }
        throw new Error(
            `Invalid mount points: ${app.mountpath}`
        );
    }

    // TODO !!!!
    const app: IApp = Express() as any;
    const onUnauthorized = Express.Router();
    // TODO const onErrorDisplay = Express.Router();

    var apiApp: Express.Application | null = null;
    var appletApp: Express.Application | null = null;

    app.use(SessionMiddleware({ 
        sessionManager,
        secret: UUID.v4(), // TODO !!!!
    }));

    // TODO
    app.useApi = (path: string) => {
        if (apiApp != null)
            throw new Error(`API already mounted to this app at ${apiApp.mountpath}`);

        const handler = new RPCHandler(AppAPIImpl({
            authManager,
            sessionManager,
            appletManager,
        }));

        app.use(
            path,
            apiApp = Express().use(async (req, res) => {
                await handler.handle(req, res, {
                    prefix: (req.baseUrl || "/") as `/${string}`,
                    context: { req },
                });
            })
        );
        return app;
    };

    app.useView = (path: string, view: IView) => {
        const viewApp = Express();
        app.use(path, viewApp);

        const getViewLocals = (): ViewLocals => {
            if (apiApp == null)
                throw new Error(
                    "`useView` requires an API to be mounted; "
                    + "Did you call `useApi`?"
                );
            return {
                routes: {
                    api: getMountPathSingle(apiApp),
                    view: getMountPathSingle(viewApp),
                    applet: appletApp != null 
                        ? getMountPathSingle(appletApp) 
                        : null,
                },
            };
        };  

        viewApp.use((req, res, next) => {
            res.locals = {
                ...res.locals,
                ...getViewLocals(),
            };
            return view(
                req as any, 
                res as Express.Response<any, ViewLocals>, 
                next,
            );
        });

        onUnauthorized.use((req, res, next) => {
            if (view.onUnauthorized == null)
                return;
            res.locals = {
                ...res.locals,
                ...getViewLocals(),
            };
            return view.onUnauthorized(
                req as any, 
                res as Express.Response<any, ViewLocals>, 
                next,
            );
        });

        return app;
    };

    app.useAppletServing = (path: string) => {
        // TODO appletmanager per route?????
        app.use(path, async (req, res, next) => {
            const sessionData = await sessionManager.query(req);
            if (sessionData == null) {
                onUnauthorized(req, res, next);
                res.status(401).send();
                return;
            }

            if (sessionData.appletRef == null)
                throw new Error("Applet ref auto-assignment not supported");
            
            // TODO should be done thru the api??
            if (!await appletManager.has(sessionData.appletRef))
                // TODO
                await appletManager.create(
                    sessionData.appletRef, 
                    { 
                        user: sessionData.user, 
                        baseUrl: req.baseUrl,
                    },
                );

            if (appletManager.serve == null) {
                res.status(204).send();
                return;
            }
            // TODO
            const applet = await appletManager.serve(sessionData.appletRef);
            return applet(req, res, next);
        });

        return app;
    };

    return app;
}

// TODO
export async function Server(
    app: Http.RequestListener,
    serverOptions: Http.ServerOptions = {},
) {
    const server = new Http.Server(serverOptions);
    server.on("request", app);
    server.on("upgrade", UpgradeListener(app));
    return server;
}
