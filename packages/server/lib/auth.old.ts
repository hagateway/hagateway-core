import Express from "express";
import { APIResponseBody } from "./std.old/api";


export class AuthError extends Error {}

export type AuthScheme = "password";

export type AuthRequest<SchemeT extends AuthScheme = AuthScheme> 
= { "password": PasswdAuthRequest }[SchemeT];

// TODO
export type PasswdAuthRequest = Express.Request<
    {}, {}, { username: string; password: string; }
>;

export interface AuthInfo<SchemeT extends AuthScheme = AuthScheme> {
    ref: string;
    scheme: SchemeT;
    displayName?: string;
    description?: string;
}


export interface AuthResult {
    user?: string;
    nextPath?: string | null;
}


export interface IAuthCallback<SchemeT extends AuthScheme = AuthScheme> {
    (req: AuthRequest<SchemeT>, authRes: AuthResult): Promise<void>;
}

export interface IAuthHandler<SchemeT extends AuthScheme = AuthScheme> {
    info: AuthInfo<SchemeT>;
    (req: AuthRequest<SchemeT>, authRes: AuthResult): Promise<void>;
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


// TODO !!!!!
export function AuthMiddleware(config: {
    authManager: IAuthManager;
    onAuthRequest?: IAuthCallback;
    onAuthSuccess?: IAuthCallback;
}): Express.RequestHandler {
    const router = Express.Router();

    router.get(
        "/callbacks",
        (_, res: Express.Response<{
            type: "data";
            body: Record<string, AuthInfo>;
            // TODO
            // body: AuthInfo[];
        }>) => {
            const infos: Record<string, AuthInfo> = { };
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
        Express.json(),
        async (
            // TODO pass next
            req: Express.Request, 
            // TODO { next?: string; }
            res: Express.Response<APIResponseBody>,
        ) => {
            const handler = config.authManager.serve(req.params.ref);
            if (handler == null) {
                res.status(400).json(null);
                return;
            }

            const authRes = {};
            await config.onAuthRequest?.(req as AuthRequest, authRes);

            // TODO
            try {
                await handler(req, authRes);
            } catch (error) {
                if (error instanceof AuthError) {
                    // TODO !!!!! 
                    res.status(401).json({ 
                        type: "error", 
                        message: error.message,
                    });
                    return;
                }
                throw new Error(
                    `An error occurred in auth handler: ${handler}`,
                    { cause: error },
                );
            }

            await config.onAuthSuccess?.(req, authRes);
            // TODO redirect!!!!! authRes.nextPath
            // { data: { next: authRes.nextPath } }
            res.status(200).json(null);            
        },
    );

    return router;
}






