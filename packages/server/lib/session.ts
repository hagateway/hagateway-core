import Express from "express";
import ExpressSession from "express-session";
import { APIResponseBody } from "./std/api";


export interface SessionData {
    user: string;
    appletRef?: string;
}

export interface ISessionManager {
    create(req: Express.Request, data: SessionData): Promise<void>;
    destroy(req: Express.Request): Promise<void>;
    has(req: Express.Request): Promise<boolean>;
    query(req: Express.Request): Promise<SessionData | null>;
    update(req: Express.Request, data: Partial<SessionData>): Promise<void>;
}


export namespace SessionManager {
    export interface Session extends ExpressSession.Session {
        data?: SessionData;
    }
}

// TODO !!!!!!
export class SessionManager implements ISessionManager {
    async create(req: Express.Request, data: SessionData) {
        const session: SessionManager.Session = req.session;
        if (session == null) 
            throw new Error("TODO");
        session.data = data;
    }

    async destroy(req: Express.Request) {
        return new Promise<void>((resolve, reject) => {
            const session: SessionManager.Session = req.session;
            if (session == null) 
                throw new Error("TODO");
            session.destroy((err) => {
                if (err != null) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async has(req: Express.Request) {
        return req.session != null;
    }

    async query(req: Express.Request) {
        const session: SessionManager.Session = req.session;
        return session?.data ?? null;
    }

    async update(req: Express.Request, data: Partial<SessionData>) {
        const session: SessionManager.Session = req.session;
        if (session == null) 
            throw new Error("TODO");
        if (session.data == null) 
            throw new Error("TODO");
        session.data = {
            ...session.data,
            ...data,
        };
    }
}



export interface ISessionMiddleware extends Express.RequestHandler {
    // TODO
}

export function SessionMiddleware(config: {
    sessionManager?: ISessionManager;
    secret: string;
}): ISessionMiddleware {
    // TODO storage backend!!!!!!!!
    const sessionHandler = ExpressSession({
        secret: config.secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            //secure: true,
            //sameSite: 'strict',
        }
    });

    const middleware: ISessionMiddleware = (req, res, next) => {
        return sessionHandler(req, res, next);
    };
    
    return middleware;
}

// TODO
export function SessionManagerMiddleware(config: {
    sessionManager: ISessionManager;
}): Express.RequestHandler {
    const router = Express.Router();

    // '/session/:id'

    router.get(
        "/current-session",
        async (req, res: Express.Response<APIResponseBody>) => {
            const sessionData = await config.sessionManager.query(req);
            if (sessionData == null) {
                res.status(404).json({
                    type: "error",
                    message: "Session not found",
                });
                return;
            }
            res.status(200).json({
                type: "data",
                // TODO get userInfo !!!!!!
                user: sessionData.user,
            });
        },
    );

    // TODO redirect?
    router.delete(
        "/current-session",
        async (req, res: Express.Response<APIResponseBody>) => {
            // TODO try catch
            await config.sessionManager.destroy(req);
            res.status(204).json();

            // TODO
            // req.session.destroy((err) => {
            //     // TODO
            //     if (err != null)
            //         throw err;
            //     res.status(204).send();
            // });
        },
    );

    return (req, res, next) => {
        return router(req, res, next);
    };
}

