
import * as DBus from "dbus-next";


namespace SystemdDBus {
    export const enum Path {
        Unit = "org.freedesktop.systemd1.Unit",
        Service = "org.freedesktop.systemd1.Service",
    }

    export const enum Error {
        NoSuchUnit = "org.freedesktop.systemd1.NoSuchUnit",
        UnknownProperty = "org.freedesktop.DBus.Error.UnknownProperty",
    }
}

class SystemdDBus {
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

    async getUnitProperty(
        unitName: string, 
        path: SystemdDBus.Path, propName: string,
        defaultVal?: any,
    ) {
        const man = await this.Manager();
        const props = await this.Properties(
            await man.GetUnit(unitName)
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
}




import { AppletSpec, IAppletManager, IAppletSpawner, AppletProxySpec, AppletProcessSpec } from "@wagateway/server/lib/applet";
import {
    Options as ProxyOptions,
    createProxyMiddleware as ProxyMiddleware,
} from "http-proxy-middleware";
// TODO
import "http-upgrade-request";



import Express from "express";


namespace SystemdRefOps {
    export function encode(ref: string, baseName: string): string {
        return [
            Buffer.from(ref).toString("base64url"), 
            baseName,
            "service",
        ].join(".");
    }

    export function decode(unitName: string, baseName: string): string | null {
        const [refEncoded, baseNameDecoded, serviceExt] = unitName.split(".");
        if (baseNameDecoded !== baseName || serviceExt !== "service")
            return null;
        return Buffer.from(refEncoded, "base64url").toString();
    }
}


import Path from "path";

namespace SystemdRuntimeDirOps {
    // TODO
    export function generate(ref: string, baseName: string): string {
        return Path.join("/run", baseName, Buffer.from(ref).toString("base64url"));
    }
}

interface SystemdUnitData {
    proxy?: AppletProxySpec | null;
}

namespace SystemdUnitDataOps {
    export function encode(data: SystemdUnitData): string {
        return Buffer.from(JSON.stringify(data)).toString("base64url");
    }

    export function decode(dataEncoded: string): SystemdUnitData {
        return JSON.parse(Buffer.from(dataEncoded, "base64url").toString());
    }
}

export interface SystemdAppletManagerConfig {
    dbus: DBus.MessageBus | "session" | "system";
    baseUnitName: string;
    pamName?: string | undefined | null;
}

export class SystemdAppletManager implements IAppletManager {
    protected readonly dbus: SystemdDBus;
    protected readonly baseUnitName: string;
    protected readonly pamName?: string;

    constructor(config: SystemdAppletManagerConfig) {
        this.dbus = new SystemdDBus(config.dbus);
        this.baseUnitName = config.baseUnitName;
        if (config.pamName != null)
            this.pamName = config.pamName;
    }

    protected readonly spawners: Set<IAppletSpawner> = new Set();
    use(spawner: IAppletSpawner) {
        this.spawners.add(spawner);
        return this;
    }

    async create(ref: string, spec: AppletSpec): Promise<string> {
        // TODO
        if (ref == null)
            throw new Error("TODO not implemented");

        var runtimeDirectory = null as string | null;
        const useRuntimeDirectory = () => {
            if (runtimeDirectory != null)
                return runtimeDirectory;
            runtimeDirectory = SystemdRuntimeDirOps.generate(ref, this.baseUnitName);
            return runtimeDirectory;
        };

        var proxySpec = null as AppletProxySpec | null;
        var processSpec = null as AppletProcessSpec | null;

        for (const spawner of this.spawners) {
            await spawner(ref, {
                spec,
                // useApp(app) {
                //     // TODO
                // },
                useProxy: async (hint) => {
                    if (proxySpec != null)
                        throw new Error("TODO");
        
                    // TODO
                    switch (hint.transport?.protocol) {
                        case "ip":
                            throw new Error("TODO not implemented");
                            break;
                        case "unix":
                            return proxySpec = {
                                ...hint,
                                transport: {
                                    protocol: hint.transport.protocol,
                                    // TODO
                                    socketPath: Path.join(
                                        useRuntimeDirectory(),
                                        "applet.sock",
                                    ),
                                },
                            };
                            break;
                        default:
                            throw new Error("TODO");
                            break;
                    }
                },
                useProcess: async (spec) => {
                    if (processSpec != null)
                        throw new Error("TODO");
                    return processSpec = spec;
                },
            });            
        }


        const props: [string, any][] = [];

        // TODO
        if (processSpec != null) {
            props.push(
                ["Type", new DBus.Variant('s', 'simple')],
                ["ExecStart", new DBus.Variant('a(sasb)', [
                    // executable, args, failUnclean,
                    [processSpec.execPath, processSpec.execArgv, true]
                ])],
            );
            if (processSpec.workingDir != null)
                props.push([
                    "WorkingDirectory", 
                    new DBus.Variant('s', processSpec.workingDir),
                ]);
            if (processSpec.env != null)
                props.push([
                    "Environment", 
                    new DBus.Variant('as', Array.from(
                        Object.entries(processSpec.env), 
                        ([key, value]) => 
                            `${key}="${value.replaceAll('"', String.raw`\"`)}"`,
                    )),
                ]);
        } else {
            props.push(
                ["Type", new DBus.Variant('s', "oneshot")],
                ["ExecStart", new DBus.Variant("a(sasb)", [
                    // executable, args, failUnclean,
                    ["true", ["true"], true]
                ])],
                ["RemainAfterExit", new DBus.Variant('b', true)],
            );
        }

        // TODO !!!!!
        props.push([
            "User", 
            new DBus.Variant('s', String(spec.user)),
        ]);

        props.push([
            "Description",
            new DBus.Variant(
                's', 
                SystemdUnitDataOps.encode({ proxy: proxySpec }),
            ),
        ])
        if (this.pamName != null)
            props.push([
                "PAMName",
                new DBus.Variant('s', this.pamName),
            ]);

        if (runtimeDirectory != null)
            props.push([
                "RuntimeDirectory", 
                new DBus.Variant(
                    'as', 
                    // TODO warn
                    // TODO https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#RuntimeDirectory=
                    [Path.relative("/run", useRuntimeDirectory())],
                ),
            ]);

        const man = await this.dbus.Manager();

        // TODO
        console.log("TODO pre: create applet unit", ref, props);

        // TODO !!!!!
        try {
            await man.StartTransientUnit(
                SystemdRefOps.encode(ref, this.baseUnitName), // name
                "fail", // mode
                props, // properties
                [], // aux
            );            
        } catch (error) {
            throw new Error(
                `Failed to to create applet: ${ref}`,
                { cause: error },
            );
        }

        return ref;
    }

    async destroy(ref: string) {
        const man = await this.dbus.Manager();
        await man.StopUnit(
            SystemdRefOps.encode(ref, this.baseUnitName), // name
            'fail', // mode
        );
    }

    async* refs() {
        const man = await this.dbus.Manager();
        for (const [unitName] of await man.ListUnits()) {
            const ref = SystemdRefOps.decode(unitName, this.baseUnitName);
            if (ref != null)
                yield ref;
        }
    }

    async has(ref: string) {
        const man = await this.dbus.Manager();
        try {
            await man.GetUnit(SystemdRefOps.encode(ref, this.baseUnitName));
            return true;
        } catch (error) {
            if (error instanceof DBus.DBusError) {
                switch (error.type) {
                case SystemdDBus.Error.NoSuchUnit:
                    return false;
                default:
                    break;
                }
            }
            throw new Error(
                `An error occurred while checking if ref exists: ${ref}`, 
                { cause: error },
            );
        }
    }

    // TODO
    protected async getUnitData(ref: string)
    : Promise<SystemdUnitData> {
        const unitName = SystemdRefOps.encode(ref, this.baseUnitName);

        const dataEncoded = await this.dbus.getUnitProperty(
            unitName, 
            SystemdDBus.Path.Unit, 
            "Description",
        );
        if (dataEncoded == null)
            throw new Error("TODO");

        return SystemdUnitDataOps.decode(dataEncoded);
    }

    // TODO !!!! cache!!!!!!!
    async serve(ref: string): Promise<Express.RequestHandler> {
        if (!await this.has(ref))
            throw new Error("TODO");

        const unitData = await this.getUnitData(ref);

        if (unitData.proxy == null) {
            return (_, res) => {
                res.status(204).end();
            };
        }

        // TODO !!!! wait for socket !!!!!!
        const proxyOptions: ProxyOptions = {
            /**
             * NOTE this must be false to prevent
             * http-proxy from automatically
             * binding the upgrade event to the listening server
             */
            ws: false,
        };
        switch (unitData.proxy.transport.protocol) {
            case "ip":
                throw new Error("TODO not implemented");
                break;
            case "unix":
                proxyOptions.target = {
                    host: "localhost",
                    port: 0,
                    socketPath: 
                        unitData.proxy.transport.socketPath,
                };
                break;
            default:
                throw new Error(
                    `Unknown transport protocol: `
                    + `${unitData.proxy.transport.protocol}`
                );
        }

        const proxyMiddleware = ProxyMiddleware(proxyOptions);

        const router = Express.Router();
        for (const spawner of this.spawners) {
            if (spawner.onRequest != null)
                router.use(spawner.onRequest);
        }
        router.use((req, res, next) => {
            if (res.upgrade != null) {
                if (res.socket == null)
                    throw new Error("HTTP upgrade detected but no socket");
                return proxyMiddleware.upgrade(req, res.socket, res.upgrade.head);
            }
            return proxyMiddleware(req, res, next);
        });

        return router;
    }
}
