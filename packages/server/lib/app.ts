// TODO
import Http from "http";
import { UpgradeListener } from "http-upgrade-request";


import Express from "express";

import { SessionMiddleware, SessionManagerMiddleware, ISessionManager, SessionManager } from "./session";
import { AuthManager, AuthMiddleware, IAuthHandler, IAuthManager } from "./auth";
// TODO
import { AppletManagerMiddleware, IAppletManager, IAppletSpawner } from "./applet";


import * as UUID from "uuid";


import { IView, ViewLocals } from "./view";
import { APIResponseBody } from "./std/api";


export interface AppConfig {
    authManager: IAuthManager;
    sessionManager: ISessionManager;
    appletManager: IAppletManager;
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
    // TODO !!!!
    const app: IApp = Express() as any;
    app.use(SessionMiddleware({ 
        sessionManager,
        secret: UUID.v4(), // TODO
    }));

    const onUnauthorized = Express.Router();

    var apiApp: Express.Application | null = null;
    // TODO
    app.useApi = (path: string) => {
        if (apiApp != null)
            throw new Error(`API already mounted to this app at ${apiApp.mountpath}`);
        app.use(
            path, 
            apiApp = Express()
                .get(
                    "/",
                    async (_, res: Express.Response<APIResponseBody>) => {
                        res.status(200).json({
                            type: "data",
                            version: "1.0.0",
                        });
                    },
                )
                .use(
                    "/auth",
                    AuthMiddleware({ authManager })
                    .protect(async (authRes, res) => {
                        sessionManager.create(res.req, { 
                            user: authRes.user, 
                            appletRef: authRes.user,
                        });
                    }),
                )
                .use(
                    "/session-manager",
                    SessionManagerMiddleware({ sessionManager }),
                )
                .use(
                    "/applet-manager",
                    AppletManagerMiddleware({ sessionManager, appletManager }),
                )
        );
        return app;
    };
    const getApiBasePath = () => {
        if (apiApp == null) {
            throw new Error("API not mounted. Did you call `useApi`?");
        }
        // TODO !!!!!!
        if (typeof apiApp.mountpath !== "string")   
            throw new Error(
                `Confused by multiple API mount points: `
                + `${apiApp.mountpath}`
            );
        return apiApp.mountpath;
    };

    app.useView = (path: string, view: IView) => {
        const viewApp = Express();
        app.use(path, viewApp);

        const getViewLocals = (): ViewLocals => {
            if (typeof viewApp.mountpath !== "string")   
                throw new Error(
                    `Confused by multiple view mount points: `
                    + `${viewApp.mountpath}`
                );

            return {
                baseApiPath: getApiBasePath(),
                baseViewPath: viewApp.mountpath,
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
                throw new Error("appletRef auto-assignment not supported");
            
            // TODO should be done thru the api??
            if (!appletManager.has(sessionData.appletRef))
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
