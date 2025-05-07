import * as DBus from "dbus-next";
import { IAccountManager } from "@hagateway/server/dist/lib/account";


export class AccountsServiceAccountManager implements IAccountManager {
    protected readonly dbus: DBus.MessageBus;

    constructor() {
        this.dbus = DBus.systemBus();
    }

    async getDisplayName(user: string): Promise<string> {
        const service = await this.dbus.getProxyObject(
            "org.freedesktop.Accounts",
            "/org/freedesktop/Accounts"
        );
        const manager = service.getInterface("org.freedesktop.Accounts");

        const userObj = await this.dbus.getProxyObject(
            "org.freedesktop.Accounts", 
            await manager.FindUserById(user),
        );
        const propsIface = userObj.getInterface("org.freedesktop.DBus.Properties");
        return (await propsIface.Get("org.freedesktop.Accounts.User", "RealName")).value
            || (await propsIface.Get("org.freedesktop.Accounts.User", "UserName")).value;
    }
}


export async function _TODO_test(user: string = "0") {
    const manager = new AccountsServiceAccountManager();
    const name = await manager.getDisplayName(user);
    console.log("TODO", name);
}