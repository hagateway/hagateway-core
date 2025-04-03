import LinuxPAM from "node-linux-pam";
import UserID from "userid";

import { AuthError, IAuthHandler, PasswdAuthRequest } from "@wagateway/server/lib/auth";


export interface PAMPasswdAuthHandlerConfig {
    pamName?: string;
}

export function PAMPasswdAuthHandler(config: PAMPasswdAuthHandlerConfig)
: IAuthHandler<"password"> {
    const handler: IAuthHandler<"password"> = async (req: PasswdAuthRequest) => {
        const { username, password } = req.query;
        if (username == null)
            throw new Error('TODO');
        if (password == null)
            throw new Error('TODO');

        // TODO
        try {
            const options: any = { username, password };
            if (config?.pamName != null)
                options.serviceName = config.pamName;

            // TODO remoteAddress?

            await LinuxPAM.pamAuthenticatePromise(options);
        } catch (err) {
            // TODO err msgs!!!
            // console.error('TODO', 'PAM', err);
            if (err instanceof LinuxPAM.PamError) {
                // TODO
                throw new AuthError(err.message);
            }
            return null;
        }
        
        return {
            user: UserID.uid(username).toString(),
        };
    };

    handler.info = {
        // TODO customizable
        ref: "pam:passwd",
        scheme: "password",
        displayName: "PAM (Password)",
        description: "Pluggable Authentication Module (PAM) - Password",
    };

    return handler;
}

