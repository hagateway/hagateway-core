import Events from "node:events";

import * as DBus from "dbus-next";


export namespace SystemdDBus {
    export const enum Path {
        Unit = "org.freedesktop.systemd1.Unit",
        Service = "org.freedesktop.systemd1.Service",
    }

    export const enum Error {
        NoSuchUnit = "org.freedesktop.systemd1.NoSuchUnit",
        UnknownProperty = "org.freedesktop.DBus.Error.UnknownProperty",
    }
}

export class SystemdDBus {
    protected readonly bus: DBus.MessageBus;

    constructor(dbus: DBus.MessageBus | "session" | "system") {
        switch (dbus) {
            case "session":
                this.bus = DBus.sessionBus();
                break;
            case "system":
                this.bus = DBus.systemBus();
                break;
            default:
                this.bus = dbus;
                break;
        }
    }

    // TODO cache??
    async Manager() {
        return (
            await this.bus.getProxyObject(
                "org.freedesktop.systemd1", 
                "/org/freedesktop/systemd1",
            )
        ).getInterface("org.freedesktop.systemd1.Manager");
    }

    async Properties(path: string) {
        return (
            await this.bus.getProxyObject(
                "org.freedesktop.systemd1", 
                path,
            )
        ).getInterface("org.freedesktop.DBus.Properties");
    }

    async getUnitPropertyValue(
        unitName: string, 
        path: SystemdDBus.Path, propName: string,
        defaultVal?: any,
    ) {
        const man = await this.Manager();
        const props = await this.Properties(
            await man.LoadUnit(unitName)
        );

        try {
            return (await props.Get(path, propName)).value;
        } catch (err) {
            if (err instanceof DBus.DBusError) {
                switch (err.type) {
                case SystemdDBus.Error.UnknownProperty:
                    return defaultVal;
                default:
                    break;
                }
            }
            throw new Error(
                `An error occurred while querying unit property over DBus: ${unitName}`, 
                { cause: err },
            );
        }
    }

    // TODO !!!!!! err handling !!!!!!!
    async* onUnitPropertyChange(
        unitName: string,
        // TODO
        path: SystemdDBus.Path, propName: string,
    ) {
        const manager = await this.Manager();
        const props = await this.Properties(
            await manager.LoadUnit(unitName)
        );

        try {
            await manager.Subscribe();
        } catch (err) {
            const handleError = (error: DBus.DBusError | any) => {
                if (error instanceof DBus.DBusError) {
                    switch (error.type) {
                    case "org.freedesktop.systemd1.AlreadySubscribed":
                        // TODO
                        return;                    
                    }
                }
                throw new Error(
                    `An error occurred while subscribing to unit property over DBus: ${unitName}`,
                    { cause: error },
                );
            };
            handleError(err);
        }

        try {
            for await (
                const [iface, changed] 
                of Events.on(props, "PropertiesChanged")
            ) {
                // TODO
                if (iface != path)
                    continue;
                // TODO
                if (changed[propName] == null)
                    continue;
                yield changed[propName].value;
            }            
        } finally {
            // TODO error handling
            try {
                await manager.Unsubscribe();
            } catch (err) {
                const handleError = (error: DBus.DBusError | any) => {
                    if (error instanceof DBus.DBusError) {
                        switch (error.type) {
                        case "org.freedesktop.systemd1.NotSubscribed":
                            // TODO
                            return;                    
                        }
                    }
                    throw new Error(
                        `An error occurred while unsubscribing to unit property over DBus: ${unitName}`,
                        { cause: error },
                    );
                };
                handleError(err);
            }
        }
    }
}


// TODO unit test!!!!!!
export async function _TODO_test() {
    const dbus = new SystemdDBus("system");
    console.log(
        await dbus.getUnitPropertyValue(
            "example.service", 
            SystemdDBus.Path.Unit, "ActiveState",
        )
    );

    for await (const state of dbus.onUnitPropertyChange(
        "example.service", 
        SystemdDBus.Path.Unit, "ActiveState",
    )) {
        console.log("TODO state", state);
    }
}
