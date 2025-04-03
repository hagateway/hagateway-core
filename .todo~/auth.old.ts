export interface Credential {
    scheme?: string;
}

export interface Authorization {
    user: string;
}

export interface IAuthenticator<CredentialT extends Credential> {
    authenticate(credential: CredentialT): Promise<Authorization>;
}



import Express, { Response, RequestHandler, NextFunction } from "express";


export interface IAuthorizationHandler {
    scheme: string;
    // TODO
    (paramString: string, res: Response, next: NextFunction): void;
}


export interface IAuthorizationRouter extends RequestHandler {
    satisfy(handler: IAuthorizationHandler): void;
}

export function AuthorizationRouter(): IAuthorizationRouter {
    const AUTH_HEADER_REGEX = /^(?<scheme>[A-Za-z]+)\s+(?<credentials>.+)$/;

    const handlers = new Map<string, IAuthorizationHandler>();

    const router: IAuthorizationRouter = (req, res, next) => {
        if (req.headers.authorization == null)
            throw new Error('TODO impl');

        const match = req.headers.authorization.match(AUTH_HEADER_REGEX);
        if (match?.groups == null)
            throw new Error('TODO impl');

        const { scheme, paramString } = match.groups as any;
        if (scheme == null)
            throw new Error('TODO impl');
        if (paramString == null)
            throw new Error('TODO impl');

        const handler = handlers.get(scheme);
        if (handler == null)
            throw new Error('TODO impl');
            // res.status(401).send('Unauthorized');

        return handler(paramString, res, next);
    };

    router.satisfy = (handler: IAuthorizationHandler) => {
        // TODO dup?
        handlers.set(handler.scheme, handler);
    };

    return router;
};


export interface BasicCredential extends Credential {
    username: string;
    password: string;
}

export interface BasicAuthorizationHandlerConfig {
    authorize: (
        credential: BasicCredential, 
        res: Response,
    ) => Promise<Authorization | null>;
    // TODO
    next?: (
        authorization: Authorization,
        res: Response, 
        next: NextFunction,
    ) => void;
}

export function BasicAuthorizationHandler(
    config: BasicAuthorizationHandlerConfig,
): IAuthorizationHandler {
    const AUTH_PARAM_REGEX = /^(?<usernameEncoded>.+):(?<passwordEncoded>.+)$/;

    const handler: IAuthorizationHandler 
        = async (paramString, res, next) => {
            // TODO
            const match = 
                Buffer.from(paramString, 'base64')
                .toString('utf-8')
                .match(AUTH_PARAM_REGEX);
            if (match?.groups == null)
                throw new Error('TODO impl');

            if (match.groups?.usernameEncoded == null)
                throw new Error('TODO impl');
            const username = decodeURIComponent(match.groups?.usernameEncoded);

            if (match.groups.passwordEncoded == null)
                throw new Error('TODO impl');
            const password = decodeURIComponent(match.groups.passwordEncoded);

            const auth = await config.authorize({ username, password }, res);
            if (auth == null)
                throw new Error('TODO impl');

            return config.next?.(auth, res, next);
        };

    handler.scheme = 'Basic';

    return handler;
}




