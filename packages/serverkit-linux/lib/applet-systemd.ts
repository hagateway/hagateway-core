import Path from "node:path";
import { Buffer } from "node:buffer";

import * as DBus from "dbus-next";
import Express from "express";
import {
    Options as ProxyOptions,
    createProxyMiddleware as ProxyMiddleware,
} from "http-proxy-middleware";
// TODO
import "http-upgrade-request";

import { AppletState } from "@hagateway/api/dist/lib/applet";
import { 
    AppletSpec, 
    IAppletManager, 
    IAppletSpawner, 
    AppletProxySpec, 
    AppletProcessSpec,
} from "@hagateway/server/dist/lib/applet";

import { waitForFile } from "./utils/fs";
import { SystemdDBus } from "./utils/systemd";


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

namespace SystemdRuntimeDirOps {
    // TODO
    export function generate(ref: string, baseName: string): string {
        return Path.join(
            "/run", [
                Buffer.from(ref).toString("base64url"), 
                baseName,
            ].join(".")
        );
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

    protected _spawner?: IAppletSpawner;
    get spawner() {
        if (this._spawner == null)
            throw new Error("A spawner has not been set. Call `useSpawner`.");
        return this._spawner;
    }

    useSpawner(spawner: IAppletSpawner) {
        if (this._spawner != null)
            throw new Error(`A spawner has already been set: ${this._spawner.info}`);
        this._spawner = spawner;
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

        await this.spawner.callback(ref, {
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
                SystemdUnitDataOps.encode({ 
                    proxy: proxySpec,
                }),
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

        const manager = await this.dbus.Manager();

        // TODO !!!!!
        try {
            await manager.StartTransientUnit(
                SystemdRefOps.encode(ref, this.baseUnitName), // name
                "fail", // mode
                props, // properties
                [], // aux
            );
        } catch (error) {
            throw new Error(
                `Failed to to create systemd applet unit: ${ref} - ${props}`,
                { cause: error },
            );
        }

        await this.wait(ref);

        return ref;
    }

    protected async wait(ref: string) {
        var state = await this.getState(ref);
        if (state === "active")
            return;

        for await (state of this.onStateChange(ref)) {
            if (state === "active")
                return;
        }
    }

    async destroy(ref: string) {
        const manager = await this.dbus.Manager();
        await manager.StopUnit(
            SystemdRefOps.encode(ref, this.baseUnitName), // name
            'fail', // mode
        );
    }

    async* refs() {
        const manager = await this.dbus.Manager();
        for (const [unitName] of await manager.ListUnits()) {
            const ref = SystemdRefOps.decode(unitName, this.baseUnitName);
            if (ref != null)
                yield ref;
        }
    }

    async has(ref: string) {
        const manager = await this.dbus.Manager();
        try {
            await manager.GetUnit(SystemdRefOps.encode(ref, this.baseUnitName));
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

        const dataEncoded = await this.dbus.getUnitPropertyValue(
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
                const { socketPath } = unitData.proxy.transport;
                if (socketPath == null)
                    throw new Error("TODO");
                proxyOptions.target = {
                    host: "localhost",
                    port: 0,
                    socketPath,
                };
                await waitForFile(socketPath);
                break;
            default:
                throw new Error(
                    `Unknown transport protocol: `
                    + `${unitData.proxy.transport.protocol}`
                );
        }

        const proxyMiddleware = ProxyMiddleware(proxyOptions);

        const router = Express.Router();
        if (this.spawner.onRequest != null)
            router.use(this.spawner.onRequest);
        router.use((req, res, next) => {
            if (res.upgrade != null) {
                if (res.socket == null)
                    throw new Error("HTTP upgrade detected but `res.socket` is `null`");
                return proxyMiddleware.upgrade(req, res.socket, res.upgrade.head);
            }
            return proxyMiddleware(req, res, next);
        });

        return router;
    }

    protected mapState(unitState: string): AppletState {
        switch (unitState) {
            case "active": break;
            case "reloading": break;
            case "inactive": break;
            case "failed": break;
            case "activating": break;
            case "deactivating": break;
            default:
                return "unknown";
        }
        return unitState;
    }

    async getState(ref: string) {
        const unitName = SystemdRefOps.encode(ref, this.baseUnitName);
        
        // TODO !!!!! validate
        return this.mapState(
            await this.dbus.getUnitPropertyValue(
                unitName, 
                SystemdDBus.Path.Unit, 
                "ActiveState",
            )
        );
    }

    // TODO !!!!! 
    async* onStateChange(ref: string) {
        const unitName = SystemdRefOps.encode(ref, this.baseUnitName);

        for await (const res of this.dbus.onUnitPropertyChange(
            unitName, 
            SystemdDBus.Path.Unit, 
            "ActiveState",
        )) { yield this.mapState(res); }
    }
}
