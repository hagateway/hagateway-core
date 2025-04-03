import { pamAuthenticatePromise, PamError } from "node-linux-pam";
import { IAuthenticator, BasicCredential, Authorization } from "./auth.old";

import UserID from "userid";


export interface PAMPasswdAuthenticatorConfig {
    pamName?: string;
}

export class PAMPasswdAuthenticator implements IAuthenticator<BasicCredential> {
    constructor(
        protected readonly config?: PAMPasswdAuthenticatorConfig,
    ) { }

    async authenticate(credential: BasicCredential) {
        try {
            const options: any = {
                username: credential.username,
                password: credential.password,
            };

            if (this.config?.pamName != null)
                options.serviceName = this.config.pamName;

            // TODO remoteAddress?

            await pamAuthenticatePromise(options);
        } catch (err) {
            // TODO err msgs!!!
            console.error('TODO', 'PAM', err);
            if (err instanceof PamError) {
                // TODO
                err.code;
            }
            // TODO
            // if (err instanceof PamError)
            //     return done(err, false);
            throw err;
        }

        return {
            user: UserID.uid(credential.username).toString(),
        };
    }

}




import { BasicAuthorizationHandler } from "./auth.old";


export interface PAMBasicAuthorizationHandlerConfig {
    pamName?: string;
}

export function PAMBasicAuthorizationHandler(
    config?: PAMBasicAuthorizationHandlerConfig,
) {
    return BasicAuthorizationHandler({
        authorize: async (credential) => {
            try {
                const options: any = {
                    username: credential.username,
                    password: credential.password,
                };
    
                if (config?.pamName != null)
                    options.serviceName = config.pamName;
    
                // TODO remoteAddress?
    
                await pamAuthenticatePromise(options);
            } catch (err) {
                // TODO err msgs!!!
                console.error('TODO', 'PAM', err);
                if (err instanceof PamError) {
                    // TODO
                    err.code;
                }
                // TODO
                // if (err instanceof PamError)
                //     return done(err, false);
                throw err;
            }
    
            return {
                user: UserID.uid(credential.username).toString(),
            };
        }
    })
}