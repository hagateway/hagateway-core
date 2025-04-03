import Express from "express";
import { APIResponseBody } from "./std/api";


export class AuthError extends Error {}


export type AuthScheme = "password";

export interface AuthInfo<SchemeT extends AuthScheme = AuthScheme> {
    ref: string;
    scheme: SchemeT;
    displayName?: string;
    description?: string;
}


export type PasswdAuthRequest = Express.Request<
    {}, {}, {}, { username: string; password: string; }
>;

export interface IAuthHandler<SchemeT extends AuthScheme = AuthScheme> {
    info: AuthInfo<SchemeT>;
    (req: { "password": PasswdAuthRequest }[SchemeT])
        : Promise<AuthResult | null>;
}


export interface IAuthManager {
    use(handler: IAuthHandler): IAuthManager;
    serve(ref: string): IAuthHandler | undefined;
    refs(): Iterable<string>;
    query(ref: string): AuthInfo | undefined;
}

export class AuthManager implements IAuthManager {
    protected readonly authHandlers = new Map<string, IAuthHandler>();

    use(handler: IAuthHandler) {
        this.authHandlers.set(handler.info.ref, handler);
        return this;
    }

    serve(ref: string) {
        return this.authHandlers.get(ref);
    }

    refs() {
        return this.authHandlers.keys();
    }

    query(ref: string) {
        return this.authHandlers.get(ref)?.info;
    }
}



export interface AuthResult {
    user: string;
}

export interface IAuthCallback {
    (authRes: AuthResult, res: Express.Response): Promise<void>;
}


export interface IAuthMiddleware extends Express.RequestHandler {
    protect(handler: IAuthCallback): IAuthMiddleware;
}

// TODO !!!!!
export function AuthMiddleware(config: {
    authManager: IAuthManager;
}): IAuthMiddleware {
    const authCallbacks = new Set<IAuthCallback>();

    const router = Express.Router();

    router.get(
        "/callbacks",
        (_, res: Express.Response<{
            type: "data";
            body: Record<string, AuthInfo>;
        }>) => {
            const infos: any = { };
            for (const ref of config.authManager.refs()) {
                const info = config.authManager.query(ref);
                if (info == null)
                    throw new Error(`Invalid auth ref: ${ref}`);
                infos[ref] = info;
            }
            res.status(200).json({
                type: "data",
                body: infos,
            });
        },
    );

    router.post(
        "/callbacks/:ref",
        async (
            req: Express.Request, 
            res: Express.Response<APIResponseBody>,
        ) => {
            const handler = config.authManager.serve(req.params.ref);
            if (handler == null) {
                res.status(400).json();
            } else {
                // TODO
                try {
                    const authRes = await handler(req as any);
                    if (authRes == null) {
                        res.status(401).json();
                    } else {
                        for (const cb of authCallbacks) {
                            await cb(authRes, res);
                        }
                        res.status(204).json();
                    }                    
                } catch (e) {
                    if (e instanceof AuthError) {
                        // TODO !!!!! 
                        res.status(401).json({ 
                            type: "error", 
                            message: e.message,
                        });
                        return;
                    }
                    throw e;
                }
            }
        },
    );

    const middleware: IAuthMiddleware = (req, res, next) => {
        return router(req, res, next);
    };
    middleware.protect = (handler) => {
        authCallbacks.add(handler);
        return middleware;
    };

    return middleware;
}

