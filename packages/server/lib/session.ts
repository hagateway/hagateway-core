import Crypto from "node:crypto";

import Express from "express";
import ExpressSession from "express-session";


export interface SessionData {
    user: string;
    appletRef?: string;
}

export interface ISessionManager {
    // TODO !!!!!!!
    secrets?: {
        enroll(secret: string | Buffer): Promise<void>;
        demote(secret: string | Buffer): Promise<void>;
        promote(secret: string | Buffer): Promise<void>;
        invalidate(secret: string | Buffer): Promise<void>;
    };
    serve(req: Express.Request): Promise<void>;
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
    protected readonly sessionHandler: Express.RequestHandler;

    constructor(config?: {
        secret?: string | string[] | null;
        store?: ExpressSession.Store;
    }) {
        this.sessionHandler = ExpressSession({
            // TODO !!!!!! rotate
            secret: config?.secret ?? Crypto.randomBytes(128),
            resave: false,
            saveUninitialized: false,
            cookie: {
                //secure: true,
                //sameSite: 'strict',
            },
            store: config?.store,
        });
    }

    async serve(req: Express.Request) {
        // TODO
        if (req.res == null || req.next == null)
            throw new Error("TODO");
        return this.sessionHandler(req, req.res, req.next);
    }

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


import { implement } from "@orpc/server";
import { SessionManagerAPIContract } from "@hagateway/api/dist/lib/session";


export function SessionManagerAPIImpl(config: {
    sessionManager: ISessionManager;
}) {
    const os = implement(SessionManagerAPIContract)
        .$context<{ req: Express.Request }>();
    
    return os.router({
        info: os.info.handler(async () => {
            return {
                version: 0,
            };
        }),
        instance: {
            destroy: os.instance.destroy.handler(async ({ context }) => {
                await config.sessionManager.destroy(context.req);
            }),
        },
    });
}
