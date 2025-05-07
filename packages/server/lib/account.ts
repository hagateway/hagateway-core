import Express from "express";
import { implement } from "@orpc/server";
import { AccountManagerAPIContract } from "@hagateway/api/dist/lib/account";

import { ISessionManager } from "./session";


export interface IAccountManager {
    getDisplayName(user: string | null): Promise<string | null>;
}

export class AccountManager implements IAccountManager {
    async getDisplayName(user: string | null): Promise<string | null> {
        // TODO
        return `user:${user}`;
    }
}

export function AccountManagerAPIImpl(
    config: { 
        accountManager: IAccountManager; 
        sessionManager: ISessionManager;
    },
) {
    const os = implement(AccountManagerAPIContract)
        .$context<{ req: Express.Request }>();

    const getSessionData = async (context: { req: Express.Request }) => {
        const sessionData 
            = await config.sessionManager.query(context.req);
        if (sessionData == null)
            throw new Error("Session not found");

        return sessionData;
    };

    return os.router({
        info: os.info.handler(() => {
            return {
                version: 0,
            };
        }),
        user: {
            getDisplayName: os.user.getDisplayName.handler(
                async ({ input, context }) => {
                    return await config.accountManager.getDisplayName(
                        input.user ?? (await getSessionData(context)).user,
                    );
                }
            ),
        },
    });
}