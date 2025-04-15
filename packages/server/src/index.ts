import Process from "node:process";

import * as Glob from "glob";
import Yargs from "yargs";
import * as YargsHelper from "yargs/helpers";

import { AuthManager, IAuthProvider } from "../lib/auth";
import { SessionManager } from "../lib/session";
import { IAppletSpawner, IAppletManager } from "../lib/applet";
import { IView } from "../lib/view";
import { App, Server } from "../lib/app";


export interface IKitRegistry {
    auth: {
        handlers: Map<string, (config?: any) => Promise<IAuthProvider>>;
    };
    session: {};
    applet: {
        spawners: Map<string, (config?: any) => Promise<IAppletSpawner>>;
        managers: Map<string, (config?: any) => Promise<IAppletManager>>;
    };
    views: Map<string, (config?: any) => Promise<IView>>;
}

export function KitRegistry(): IKitRegistry {
    return {
        auth: {
            handlers: new Map(),
        },
        session: {},
        applet: {
            spawners: new Map(),
            managers: new Map(),
        },
        views: new Map(),
    };
}

export interface IKit {
    (kitRegistry: IKitRegistry): void;
}

export namespace RunConfig {
    function isRef(obj: any): obj is string {
        return typeof obj === "string";
    }

    export interface Configurable<ConfigT = any> {
        $: string;
        config?: ConfigT;
    }

    function isConfigurable(obj: any): obj is Configurable {
        return typeof obj === "object" && obj != null && "$" in obj;
    }

    export async function instantiate<ConfigT, InstanceT>(
        ref: string | Configurable | InstanceT, 
        registry: Map<string, (config?: ConfigT) => Promise<InstanceT>>,
    ): Promise<InstanceT | null> {
        if (isRef(ref)) {
            return await registry.get(ref)?.() ?? null;
        }

        if (isConfigurable(ref)) {
            return await registry.get(ref.$)?.(ref.config) ?? null;
        }

        return ref;
    }

    export interface ErrorInfo {
        message: string;
        details: {
            location: any;
            target: Partial<RunConfig>;
        };
        cause?: Error | any;
    }
}

export interface RunConfig {
    // TODO
    include?: string | string[];

    kits?: (string | IKit)[];
    net: string | { host: string; port: number };
    auth: { 
        providers: (string | RunConfig.Configurable | IAuthProvider)[]; 
    };
    // session: { store: string };
    applet: { 
        spawners: (string | RunConfig.Configurable | IAppletSpawner)[];
        // TODO default subproc manager?
        manager: string | RunConfig.Configurable | IAppletManager;
    };
    view?: string | RunConfig.Configurable | IView;
}

export function Main() {
    const kitRegistry = KitRegistry();

    const useKit = async (kitRef: string | IKit) => {
        var kit: IKit;
        switch (typeof kitRef) {
            case "string":
                const module = await import(kitRef);
                kit = module.default?.default ?? module.default ?? module;
                break;
            case "object":
                kit = kitRef;
                break;
            default:
                throw new Error(`Invalid kit reference: ${kitRef}`);
        }
        kit(kitRegistry);
    };

    var netSpec: string | { host: string; port: number } | null = null;
    var authManager = new AuthManager();
    var sessionManager = new SessionManager();
    var appletManager: IAppletManager | null = null;
    var view: IView | null = null;

    const configure = async (spec: Partial<RunConfig>) => {
        for (const key of Object.keys(spec)) {
            switch (key) {
                case "include": {
                    const includes: string[] = [];
                    if (spec.include != null) {
                        switch (typeof spec.include) {
                            case "string":
                                includes.push(spec.include);
                                break;
                            case "object":
                                // TODO
                                if (!Array.isArray(spec.include))
                                    throw {
                                        message: `Invalid include, `
                                            + `not an array: ${spec.include}`,
                                        details: {
                                            location: [key, spec.include],
                                            target: spec,
                                        },
                                    } satisfies RunConfig.ErrorInfo;
                                includes.push(...spec.include);
                                break;
                            default:
                                throw {
                                    message: `Invalid include: ${spec.include}`,
                                    details: {
                                        location: [key, spec.include],
                                        target: spec,
                                    },
                                } satisfies RunConfig.ErrorInfo;
                        }
                    }

                    for (const include of await Glob.glob(includes)) {
                        var module;
                        try {
                            module = await import(include);
                        } catch (e) {
                            throw {
                                message: `An error occurred while importing `
                                    + `the javascript/json config: ${include}`,
                                details: {
                                    location: [key, spec.include],
                                    target: spec,
                                },
                                cause: e,
                            } satisfies RunConfig.ErrorInfo;
                        }
                        // TODO parse with zod!!!!
                        await configure(module.default as RunConfig);
                    }

                    break;
                }
                case "kits": {
                    for (const kitRef of spec.kits ?? []) {
                        try {
                            await useKit(kitRef);
                        } catch (e) {
                            throw {
                                message: `An error occurred while loading kit: ${kitRef}`,
                                details: {
                                    location: [key, spec.kits],
                                    target: spec,
                                },
                                cause: e,
                            } satisfies RunConfig.ErrorInfo;
                        }
                    }
                    break;
                }
                case "net": {
                    if (netSpec != null)
                        throw {
                            message: "Network config already specified, " 
                                + "possibly in another config",
                            details: {
                                location: [key, spec.net],
                                target: spec,
                            },
                        } satisfies RunConfig.ErrorInfo;
                    netSpec = spec.net!;
                    break;
                }
                case "auth": {
                    for (const handlerRef of spec.auth!.providers ?? []) {
                        const handler = await RunConfig.instantiate(
                            handlerRef,
                            kitRegistry.auth.handlers,
                        );
                        if (handler == null)
                            throw {
                                message: `Invalid auth handler (reference): ${handlerRef}`,
                                details: {
                                    location: [key, spec.auth],
                                    target: spec,
                                },
                            } as RunConfig.ErrorInfo;
                        authManager.use(handler);
                    }
                    break;
                }
                case "applet": {
                    if (appletManager != null)
                        throw {
                            message: "Applet manager already specified, "
                                + "possibly in another config",
                            details: {
                                location: [key, spec.applet],
                                target: spec,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    appletManager = await RunConfig.instantiate(
                        spec.applet!.manager,
                        kitRegistry.applet.managers,
                    );
                    if (appletManager == null)
                        throw {
                            message: `Invalid applet manager (reference): ${spec.applet!.manager}`,
                            details: {
                                location: [key, spec.applet],
                                target: spec,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    for (const spawnerRef of spec.applet!.spawners) {
                        const spawner = await RunConfig.instantiate(spawnerRef, kitRegistry.applet.spawners);
                        if (spawner == null)
                            throw {
                                message: `Invalid applet spawner (reference): ${spawnerRef}`,
                                details: {
                                    location: [key, spec.applet],
                                    target: spec,
                                },
                            } satisfies RunConfig.ErrorInfo;
                        appletManager.use(spawner);
                    }

                    break;
                }
                case "view": {
                    if (view != null)
                        throw {
                            message: "View already specified, possibly in another config",
                            details: {
                                location: [key, spec.view],
                                target: spec,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    view = await RunConfig.instantiate(spec.view!, kitRegistry.views);
                    if (view == null)
                        throw {
                            message: `Invalid view (reference): ${spec.view}`,
                            details: {
                                location: [key, spec.view],
                                target: spec,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    // TODO
                    break;
                }
            }
        }
    };

    const run = async (config: Partial<RunConfig>) => {
        await configure(config);

        if (appletManager == null)
            throw new Error(
                "No applet manager specified in the config. "
                + "Did you set `applet.manager`?",
            );

        const app = App({
            authManager,
            sessionManager,
            appletManager,
        });
        // TODO !!!!
        app.useApi("/~portal/api");
        if (view != null)
            app.useView("/~portal", view);
        app.useAppletServing("/");

        const server = await Server(app);
        server.on("listening", () => {
            // TODO
            console.log(server.address());
        });

        switch (typeof netSpec) {           
            case "string":
                server.listen(netSpec);
                break;
            case "object":
                if (netSpec == null)
                    throw new Error(
                        "No net spec specified. "
                        + "Did you set `net` in the config?",
                    );
                server.listen(netSpec.port, netSpec.host);
                break;
            default:
                throw new Error(`Unexpected net spec: ${netSpec}`);
        }

        return { app, server };
    };

    return { run };
}

export function CliMain() {
    const yargs = Yargs();

    yargs.strict();
    yargs.demandCommand(1, "You need to specify a command");
    yargs.recommendCommands();
    yargs.command(
        "serve <config>",
        "Start the server",
        (yargs) => {
            return yargs.positional("config", {
                describe: "JSON config string",
                type: "string",
                demandOption: true,
            })
        },
        async (argv) => {
            // TODO validate with zod
            const config = JSON.parse(argv.config);
            const main = Main();
            await main.run(config);
        },
    );

    const run = async (
        argv: string[] = YargsHelper.hideBin(Process.argv),
    ) => {
        // TODO ...
        yargs.parse(argv);
    };

    return { run };
}

if (require.main === module) {
    CliMain().run();
}