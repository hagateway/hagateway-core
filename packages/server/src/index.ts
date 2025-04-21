#!/usr/bin/env node

import Process from "node:process";
import Path from "node:path";

import Yargs from "yargs";
import * as YargsHelper from "yargs/helpers";

import { AuthManager, IAuthManager, IAuthProvider } from "../lib/auth";
import { ISessionManager, SessionManager } from "../lib/session";
import { IAppletSpawner, IAppletManager } from "../lib/applet";
import { IView } from "../lib/view";
import { App, Server } from "../lib/app";


export interface ConfigureContext {
    baseDirectory?: string;
}

export interface IKitConfig {
    context: ConfigureContext;
}

export interface IKitRegistry {
    auth: {
        managers: Map<string, (config?: IKitConfig & object) => Promise<IAuthManager>>;
        providers: Map<string, (config?: IKitConfig & object) => Promise<IAuthProvider>>;
    };
    session: {
        managers: Map<string, (config?: IKitConfig & object) => Promise<ISessionManager>>;
    };
    applet: {
        managers: Map<string, (config?: IKitConfig & object) => Promise<IAppletManager>>;
        spawners: Map<string, (config?: IKitConfig & object) => Promise<IAppletSpawner>>;
    };
    views: Map<string, (config?: IKitConfig & object) => Promise<IView>>;
}

export function KitRegistry(): IKitRegistry {
    return {
        auth: {
            managers: new Map([
                ["default", async () => new AuthManager()],
            ]),
            providers: new Map(),
        },
        session: {
            managers: new Map([
                // TODO !!!!!!!!!!!!!
                ["default", async (config?: IKitConfig & { secret?: string; }) => {
                    return new SessionManager(config);
                }],
            ]),
        },
        applet: {
            // TODO default subproc manager?
            managers: new Map(),
            spawners: new Map(),
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

    export type Instantiable<ConfigT, InstanceT>
        = string | Configurable<ConfigT> | InstanceT;

    export async function instantiate<ConfigT, InstanceT>(
        ref: Instantiable<ConfigT, InstanceT>, 
        registry: Map<string, (config?: ConfigT) => Promise<InstanceT>>,
        defaultConfig?: ConfigT,
    ): Promise<InstanceT | null> {
        if (isRef(ref)) {
            return await registry.get(ref)?.({
                ...defaultConfig
            } as ConfigT) ?? null;
        }

        if (isConfigurable(ref)) {
            return await registry.get(ref.$)?.({
                ...defaultConfig, 
                ...ref.config,
            } as ConfigT) ?? null;
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

export interface RunContext {
    runtimeDirectory?: string;
}

export interface RunConfig {
    context?: RunContext;

    // TODO
    include?: string | string[];

    kits?: (string | IKit)[];
    net: string | { host: string; port: number; };
    // http: {};
    auth: { 
        manager: RunConfig.Instantiable<IKitConfig & object, IAuthManager>;
        providers: RunConfig.Instantiable<IKitConfig & object, IAuthProvider>[];
    };
    session: { 
        manager: RunConfig.Instantiable<IKitConfig & object, ISessionManager>;
    };
    applet: { 
        // TODO default subproc manager?
        manager: RunConfig.Instantiable<IKitConfig & object, IAppletManager>;        
        spawners: RunConfig.Instantiable<IKitConfig & object, IAppletSpawner>[];
    };
    view?: RunConfig.Instantiable<IKitConfig & object, IView>;
}

export interface RunConfigConstructor {
    // TODO
    (context?: RunContext | null): Partial<RunConfig>;
}

export function Main() {
    const kitRegistry = KitRegistry();

    const useKit = async (
        kitRef: string | IKit,
        // TODO
        context?: ConfigureContext,
    ) => {
        var kit: IKit;
        switch (typeof kitRef) {
            case "string":
                // TODO !!!
                const module = require(
                    require.resolve(
                        kitRef, 
                        { paths: [context?.baseDirectory ?? "."] }
                    )
                );
                // const module = await import(kitRef);
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

    var runContext: RunContext | null = null;
    var netSpec: string | { host: string; port: number } | null = null;
    var authManager: IAuthManager | null = null;
    var sessionManager: ISessionManager | null = null;
    var appletManager: IAppletManager | null = null;
    var view: IView | null = null;

    const configure = async (
        input: 
            | Partial<RunConfig> 
            | RunConfigConstructor,
        context: ConfigureContext = {},
    ) => {
        var config: Partial<RunConfig>;
        switch (typeof input) {
            case "function":
                // TODO !!!!!!
                config = input(runContext);
                break;
            case "object":
                config = input;
                break;
            default:
                // TODO !!!!!!
                throw new Error("TODO");
        }

        for (const key of Object.keys(config)) {
            switch (key) {
                case "context": {
                    if (runContext != null)
                        throw {
                            message: "Run context already specified, "
                                + "possibly in another config",
                            details: {
                                location: [key, config.context],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    runContext = config.context ?? null;
                    break;
                }
                case "include": {
                    const includes: string[] = [];
                    if (config.include != null) {
                        switch (typeof config.include) {
                            case "string":
                                includes.push(config.include);
                                break;
                            case "object":
                                // TODO
                                if (!Array.isArray(config.include))
                                    throw {
                                        message: `Invalid include, `
                                            + `not an array: ${config.include}`,
                                        details: {
                                            location: [key, config.include],
                                            target: config,
                                        },
                                    } satisfies RunConfig.ErrorInfo;
                                includes.push(...config.include);
                                break;
                            default:
                                throw {
                                    message: `Invalid include: ${config.include}`,
                                    details: {
                                        location: [key, config.include],
                                        target: config,
                                    },
                                } satisfies RunConfig.ErrorInfo;
                        }
                    }

                    for (var include of includes) {
                        var module;
                        try {
                            // TODO
                            module = require(
                                require.resolve(
                                    include,
                                    { paths: [context?.baseDirectory ?? "."] }
                                )                                
                            );
                            // TODO
                            // module = await import(include);
                        } catch (e) {
                            throw {
                                message: `An error occurred while importing `
                                    + `the javascript/json config: ${include}`,
                                details: {
                                    location: [key, config.include],
                                    target: config,
                                },
                                cause: e,
                            } satisfies RunConfig.ErrorInfo;
                        }
                        // TODO parse with zod!!!!
                        
                        await configure(module.default, {
                            // TODO !!!!
                            baseDirectory: Path.dirname(require.resolve(include)),
                        });
                    }

                    break;
                }
                case "kits": {
                    for (const kitRef of config.kits ?? []) {
                        try {
                            await useKit(kitRef, context);
                        } catch (e) {
                            throw {
                                message: `An error occurred while loading kit: ${kitRef}`,
                                details: {
                                    location: [key, config.kits],
                                    target: config,
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
                                location: [key, config.net],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;
                    netSpec = config.net!;
                    break;
                }
                case "auth": {
                    if (authManager != null)
                        throw {
                            message: "Auth manager already specified, "
                                + "possibly in another config",
                            details: {
                                location: [key, config.auth],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;
                    authManager = await RunConfig.instantiate(
                        config.auth!.manager,
                        kitRegistry.auth.managers,
                        { context },
                    );
                    if (authManager == null)
                        throw {
                            message: `Invalid auth manager (reference): ${config.auth!.manager}`,
                            details: {
                                location: [key, config.auth],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    if (authManager == null)
                        throw new Error("TODO");

                    for (const handlerRef of config.auth!.providers ?? []) {
                        const handler = await RunConfig.instantiate(
                            handlerRef,
                            kitRegistry.auth.providers,
                            { context },
                        );
                        if (handler == null)
                            throw {
                                message: `Invalid auth handler (reference): ${handlerRef}`,
                                details: {
                                    location: [key, config.auth],
                                    target: config,
                                },
                            } as RunConfig.ErrorInfo;
                        authManager.use(handler);
                    }
                    break;
                }
                case "session": {
                    if (sessionManager != null)
                        throw {
                            message: "Session manager already specified, "
                                + "possibly in another config",
                            details: {
                                location: [key, config.session],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    sessionManager = await RunConfig.instantiate(
                        config.session!.manager,
                        kitRegistry.session.managers,
                        { context },
                   );
                    if (sessionManager == null)
                        throw {
                            message: `Invalid session manager (reference): ${config.session!.manager}`,
                            details: {
                                location: [key, config.session],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;
                    
                    break;
                }
                case "applet": {
                    if (appletManager != null)
                        throw {
                            message: "Applet manager already specified, "
                                + "possibly in another config",
                            details: {
                                location: [key, config.applet],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    appletManager = await RunConfig.instantiate(
                        config.applet!.manager,
                        kitRegistry.applet.managers,
                        { context },
                    );
                    if (appletManager == null)
                        throw {
                            message: `Invalid applet manager (reference): ${config.applet!.manager}`,
                            details: {
                                location: [key, config.applet],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    for (const spawnerRef of config.applet!.spawners) {
                        const spawner = await RunConfig.instantiate(
                            spawnerRef, 
                            kitRegistry.applet.spawners,
                            { context },
                        );
                        if (spawner == null)
                            throw {
                                message: `Invalid applet spawner (reference): ${spawnerRef}`,
                                details: {
                                    location: [key, config.applet],
                                    target: config,
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
                                location: [key, config.view],
                                target: config,
                            },
                        } satisfies RunConfig.ErrorInfo;

                    view = await RunConfig.instantiate(
                        config.view!, 
                        kitRegistry.views,
                        { context },
                    );
                    if (view == null)
                        throw {
                            message: `Invalid view (reference): ${config.view}`,
                            details: {
                                location: [key, config.view],
                                target: config,
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

        if (authManager == null)
            throw new Error(
                "No auth manager specified in the config. "
                + "Did you set `auth.manager`?",
            );
        if (appletManager == null)
            throw new Error(
                "No applet manager specified in the config. "
                + "Did you set `applet.manager`?",
            );
        if (sessionManager == null)
            throw new Error(
                "No session manager specified in the config. "
                + "Did you set `session.manager`?",
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
            // TODO !!!!!!
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
                throw new Error(`Net spec has unexpected type ${typeof netSpec}: ${netSpec}`);
        }

        return { app, server };
    };

    return { run };
}

export function CLIMain() {
    const yargs = Yargs();

    yargs.strict();
    yargs.demandCommand(1, "You need to specify a command");
    yargs.recommendCommands();
    // TODO no business logic!!!!
    yargs.command(
        "serve <configs...>",
        "Start the server",
        (yargs) => {
            return yargs.positional("configs", {
                describe: "JSON config string",
                type: "string",
                demandOption: true,
            })
        },
        async (argv) => {
            // TODO validate with zod
            
            var config = {};
            for (const c of argv.configs) {
                config = {
                    ...config,
                    ...JSON.parse(c),
                };
            }
            const main = Main();
            await main.run(config);
        },
    );

    return { 
        run: async (
            argv: string[] = YargsHelper.hideBin(Process.argv),
        ) => {
            // TODO ...
            await yargs.parse(argv);
        }
    };
}

if (require.main === module) {
    CLIMain().run();
}