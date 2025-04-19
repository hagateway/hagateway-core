import LinuxPAM from "node-linux-pam";
import UserID from "userid";

import { IAuthProvider, AuthError } from "@hagateway/server/dist/lib/auth";


export interface PAMPasswdAuthProviderConfig {
    pamName?: string;
}

export function PAMPasswdAuthProvider(config: PAMPasswdAuthProviderConfig)
: IAuthProvider {
    return {
        info: {
            type: "password",
            ref: "pam",
            displayName: "PAM (Password)",
            description: "Pluggable Authentication Module (PAM) - Password",
        },
        callback: async ({ input, result }) => {
            // TODO
            try {
                const options: any = { 
                    username: input.username, 
                    password: input.password,
                };
                if (config?.pamName != null)
                    options.serviceName = config.pamName;
    
                // TODO remoteAddress?
    
                await LinuxPAM.pamAuthenticatePromise(options);
            } catch (error) {
                if (error instanceof LinuxPAM.PamError) 
                    throw new AuthError(error.message, { cause: error });
                throw new Error(
                    "An error occurred during PAM authentication", 
                    { cause: error },
                );
            }
            
            result.user = UserID.uid(input.username).toString();
        },
    };
}

