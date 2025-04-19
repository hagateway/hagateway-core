import Express from "express";
import { implement } from "@orpc/server";
import { AuthType, AuthInfo, AuthInput, AuthAPIContract } from "@hagateway/api/dist/lib/auth";


export class AuthError extends Error {}

// TODO
export interface AuthResult {
    user?: string;
    // nextPath?: string | null;
}

export interface AuthContext {
    input: AuthInput; 
    result: AuthResult;
    req: Express.Request;
}

// TODO
export interface IAuthProvider {
    info: AuthInfo;
    callback: (context: AuthContext) => Promise<void>;
}

export type IAuthProviderRef = [type: AuthType, name: string];

export interface IAuthManager {
    use(provider: IAuthProvider): IAuthManager;
    serve(ref: IAuthProviderRef): IAuthProvider | undefined;
    refs(): Iterable<IAuthProviderRef>;
    query(ref: IAuthProviderRef): AuthInfo | undefined;
}

export class AuthManager implements IAuthManager {
    protected readonly authProvidersHashMap = new Map<string, IAuthProvider>();
    protected readonly hashRef = (ref: IAuthProviderRef): string => {
        return JSON.stringify(ref);
    };
    
    use(provider: IAuthProvider) {
        this.authProvidersHashMap.set(
            this.hashRef([
                provider.info.type,
                provider.info.ref,
            ]),
            provider,
        );

        return this;
    }

    serve(ref: IAuthProviderRef) {
        return this.authProvidersHashMap.get(this.hashRef(ref));
    }

    *refs() {
        for (const provider of this.authProvidersHashMap.values()) {
            yield [provider.info.type, provider.info.ref] satisfies IAuthProviderRef;
        }
    }

    query(ref: IAuthProviderRef) {
        return this.authProvidersHashMap.get(this.hashRef(ref))?.info;
    }
}

export function AuthAPIImpl(config: {
    authManager: IAuthManager;
    onAuthRequest?: (context: AuthContext) => Promise<void>;
    onAuthSuccess?: (context: AuthContext) => Promise<void>;
}) {
    const os = implement(AuthAPIContract)
        .$context<{ req: Express.Request }>();

    return os.router({
        info: os.info.handler(() => {
            return {
                version: 0,
                callbacks: Array.from(
                    config.authManager.refs(),
                    (ref) => {
                        return config.authManager.query(ref)!;
                    },
                ),
            };
        }),
        // TODO error
        callback: os.callback.handler(async ({ input, context, errors }) => {
            const authContext: AuthContext = {
                input,
                result: {},
                req: context.req,
            };
            
            await config.onAuthRequest?.(authContext);

            const provider = config.authManager.serve([
                input.type,
                input.ref,
            ]);
            if (provider == null) {
                throw new Error(`Auth provider not found with input: ${input}`);
            }

            try {
                await provider.callback(authContext);
            } catch (error) {
                if (error instanceof AuthError)
                    throw errors.UNAUTHORIZED({
                        message: error.message,
                    });
                // TODO
                throw error;
            }

            await config.onAuthSuccess?.(authContext);
        }),
    });
}