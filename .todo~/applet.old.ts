
import * as DBus from "dbus-next";


class SystemdDBus {
    protected readonly bus: DBus.MessageBus;

    constructor(dbus: DBus.MessageBus | 'session' | 'system') {
        switch (dbus) {
            case 'session':
                this.bus = DBus.sessionBus();
                break;
            case 'system':
                this.bus = DBus.systemBus();
                break;
            default:
                this.bus = dbus;
                break;
        }
    }

    async Manager() {
        return (
            await this.bus.getProxyObject(
                'org.freedesktop.systemd1', 
                '/org/freedesktop/systemd1',
            )
        ).getInterface('org.freedesktop.systemd1.Manager');
    }

    async Properties(path: string) {
        return (
            await this.bus.getProxyObject(
                'org.freedesktop.systemd1', 
                path,
            )
        ).getInterface('org.freedesktop.DBus.Properties');
    }

    static readonly Paths = {
        Unit: 'org.freedesktop.systemd1.Unit',
        Service: 'org.freedesktop.systemd1.Service',
    };

    static readonly Errors = {
        NoSuchUnit: 'org.freedesktop.systemd1.NoSuchUnit',
        UnknownProperty: 'org.freedesktop.DBus.Error.UnknownProperty',
    };
}


import { IAppletManager, ExternalProcessSpec } from "@wagateway/server/lib/applet";


export interface SystemdProcesSpec extends ExternalProcessSpec {
    pamName?: string;
}

export interface SystemdProcessManagerConfig {
    dbus?: DBus.MessageBus | 'session' | 'system';
    baseUnitName: string;
    // serve: (ref: any) => RequestHandler;
    
}


/*

export class SystemdAppletManager extends ExternalAppletManager {

    _TODO(ref: string) {

    }
}

*/


export class SystemdProcessManager
implements IAppletManager {
    public readonly systemdDBus: SystemdDBus;
    protected readonly baseUnitName: string;

    constructor(
        config: SystemdProcessManagerConfig,
    ) {
        this.systemdDBus = new SystemdDBus(config.dbus ?? 'system');
        this.baseUnitName = config.baseUnitName;
    }

    protected encodeUnitName(ref: string): string {
        return [
            Buffer.from(ref).toString('base64url'), 
            this.baseUnitName, 
            'service',
        ].join('.');
    }

    protected decodeRef(unitName: string): string | null {
        const [refEncoded, baseUnitName, serviceExt] = unitName.split('.');
        if (baseUnitName !== this.baseUnitName || serviceExt !== 'service')
            return null;
        return Buffer.from(refEncoded, 'base64url').toString();
    }

    // TODO autoassign ref????
    async create(ref: string | null, specs: SystemdProcesSpec) {
        // TODO throw error if already exists
        const man = await this.systemdDBus.Manager();

        // TODO
        if (ref == null)
            throw new Error('TODO not implemented');

        const props: [string, any][] = [
            ['Type', new DBus.Variant('s', 'simple')],
            ['ExecStart', new DBus.Variant('a(sasb)', [
                // executable, args, fail_unclean,
                [specs.execPath, specs.execArgv, true]
            ])],
        ];
        // TODO !!!!!
        if (specs.user != null)
            props.push([
                'User', 
                new DBus.Variant('s', String(specs.user)),
            ]);
            
        //
        if (specs.workingDir != null)
            props.push([
                'WorkingDirectory', 
                new DBus.Variant('s', specs.workingDir),
            ]);
        if (specs.env != null)
            props.push([
                'Environment', 
                new DBus.Variant('as', Array.from(
                    Object.entries(specs.env), 
                    ([key, value]) => 
                        `${key}="${value.replaceAll('"', String.raw`\"`)}"`,
                )),
            ]);

        if (specs.pamName != null)
            props.push([
                'PAMName',
                new DBus.Variant('s', specs.pamName),
            ]);
        
        await man.StartTransientUnit(
            this.encodeUnitName(ref), // name
            'fail', // mode
            props, // properties
            [], // aux
        );

        return ref;
    }

    async destroy(ref: string) {
        const man = await this.systemdDBus.Manager();
        await man.StopUnit(
            this.encodeUnitName(ref), // name
            'fail', // mode
        );
    }

    async* refs() {
        const man = await this.systemdDBus.Manager();
        for (const [unitName] of await man.ListUnits()) {
            const ref = this.decodeRef(unitName);
            if (ref != null)
                yield ref;
        }
    }

    async has(ref: string) {
        const man = await this.systemdDBus.Manager();
        try {
            await man.GetUnit(this.encodeUnitName(ref));
            return true;
        } catch (err) {
            if (err instanceof DBus.DBusError) {
                switch (err.type) {
                case SystemdDBus.Errors.NoSuchUnit:
                    return false;
                default:
                    break;
                }
            }
            throw err;
        }
    }

    // async serve(ref: string) {
    //     // TODO
    //     return (req, res, next) => {
    //         res.send('TODO');
    //     };
    // }

    // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // async get(ref: string): Promise<ProcessSpecs> {
    //     const man = await this.systemdDbus.Manager();
    //     const props = await this.systemdDbus.Properties(
    //         man.GetUnit(this.name_of.to(ref))
    //     );
    //     const try_get_prop = async (
    //         path: string, name: string, 
    //         default_val?: any,
    //     ) => {
    //         try {
    //             return (await props.Get(path, name)).value;
    //         } catch (err) {
    //             if (err instanceof DBus.DBusError) {
    //                 switch (err.type) {
    //                 case SystemdDBus.Errors.UnknownProperty:
    //                     return default_val;
    //                 default:
    //                     break;
    //                 }
    //             }
    //             throw err;
    //         }
    //     }

    //     const [[executable, args, ..._]] = await try_get_prop(
    //         SystemdDBus.Paths.Service, 'ExecStart'
    //     );
    //     const description = await try_get_prop(
    //         SystemdDBus.Paths.Unit, 'Description'
    //     );
        
    //     // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!
    //     return {
    //         exec: executable,
    //         args: args,
    //         // TODO user group
    //         ...(description 
    //             && {data: Buffer.from(description, 'base64').toString()})
    //     };
    // }

    // TODO query ???
    //async query(ref: RefT): ProcessInfo {}

}






// TODO
async function TODO_test() {
    var man = new SystemdProcessManager({
        dbus: 'system',
        baseUnitName: 'todo',
    })
    
    
    await man.create('someproc', {
        user: '0',
        execPath: '/bin/sleep',
        execArgv: ['/bin/sleep', '10'],
        env: {
            'SOME_ENV': 'some_value'
        }
    });
}




// TODO rm /////////////

import {
    Options as ProxyOptions,
    RequestHandler as ProxyRequestHandler,
    createProxyMiddleware as ProxyMiddleware,
} from "http-proxy-middleware";
import { ISessionManager } from "./session";







// class AbstractAppletManager {
//     use(spawner: IAppletSpawner) {



//         const config = {};



//         // TODOa({ useProxy });

//     }

//     create(ref: string | null, spec: AppletSpec) {
//         let spawner: IAppletSpawner;

        
//         // TODO
//         spawner(
//             ref, { 
//                 spec, 
//                 useRequestHandler(handler) {
//                     //

//                 },
//                 useProxy(config) {
//                     // TODO
//                     config.transport;
//                 },
//                 useProcess(config) {},
//             }
//         );
//     }
// }




export interface ExternalAppletSpec {
    location?: {
        transport: 'ip' | 'unix';
        protocol: string;
        host: string;
        port: number;
        socketPath?: string;
    };
    // proxyOptions?: ProxyOptions;

    execPath: string;
    execArgs: string[];

    workingDir?: string;
    env?: Record<string, string>;
}


export interface SpawnerArgs {
    useUNIXSocket: (options?: { create?: boolean }) => string;
}





// export abstract class ExternalAppletManager /* implements IAppletManager */ {

//     _TODO(ref: string | null, spec: ExternalAppletSpec) {
//         // TODO
        
//     }


//     // TODO
//     async serve(ref: string) {
//         // TODO get proxyopts
//         const spec = await this.query(ref);
//         if (spec.proxyOptions == null)
//             throw new Error(
//                 `Process cannot be proxied due to missing proxyOptions in ${spec}`
//             );
//         return ProxyMiddleware(spec.proxyOptions);
//     }

// }




// TODO
export function ProcessManagerMiddleware(
    config: { processManager: IAppletManager; }
): Express.RequestHandler {
    const router = Express.Router();

    // TODO redirect /current-process to /processes/...

    router.post(
        '/current-process',
        async (req, res) => {
            // TODO
            // const ref = await config.processManager.create(null, ...);
            // res.status(201).json(ref);
        },
    );

    router.delete(
        '/current-process',
        async (req, res) => {
            // TODO
            //config.processManager.destroy
        },
    );

    router.post(
        '/processes',
        async (_, res: Express.Response<{}>) => {
            // TODO
            config.processManager.create
            // TODO
            // const ref = await config.processManager.create(null, ...);
            // res.status(201).json(ref);
        },
    );

    router.delete(
        '/processes/:ref',
        async (req: Express.Request<{
            confirm: boolean;
        }>, res) => {
            // TODO confirm query
            //req.query.confirm;
            // TODO
            //config.processManager.destroy(req.params.ref);
        },
    );

    return (req, res, next) => {
        return router(req, res, next);
    };
}



export interface SpawnerSpec {
    baseURL?: string;
    host?: string;
    port?: number;
    socketPath?: string;
}

export interface ExternalProcessManagerConfig {
    transport: 'ip' | 'unix';
    spawner: (spec: SpawnerSpec) => {
        execPath: string;
        execArgs: string[];
        workingDir?: string;
        env?: Record<string, string>;
    };

    getProcessArgs: (
        proxySpec: SpawnerSpec, 
        //spawn: () => void,
    ) => void;
}


export interface Applet {
    displayName?: string;
}

export interface ExternalApplet extends Applet {
    execPath: string;
    execArgs: string[];

    workingDir?: string;
    env?: Record<string, string>;

    location?: {
        transport: 'ip' | 'unix';
        protocol: string;
        host: string;
        port: number;
        socketPath?: string;
    };
}



// export class ProcessManager implements IProcessManager {
//     constructor(protected readonly config: ProcessManagerConfig) {}

//     serve(ref: string) {
//         // this.config.backend.serve
//     }
// }





// TODO necesito??
// export function ProcessMiddlware(
//     config: { processManager: IProcessManager<ProcessSpec>; }
// ): Express.RequestHandler {
//     return (req, res) => {
        
//         // TODO
//         if (config.processManager.serve == null) {
//             res.status(200).end();
//             return;
//         }

//         // req.session

//         // TODO
//         config.processManager.serve
//     };
// }





export interface ExternalProcessSpec extends AppletSpec {
    location?: {
        protocol?: string | undefined;
        host: string;
        hostname?: string | undefined;
        port: number;
        socketPath?: string | undefined;
    };

    execPath: string;
    execArgv: string[];

    workingDir?: string;
    env?: Record<string, string>;    

    // proxyOptions?: {
    //     target: {
    //         host: string;
    //         port: number;
    //         protocol?: string | undefined;
    //         hostname?: string | undefined;
    //         socketPath?: string | undefined;            
    //     };
    // };
}




// import {
//     Options as ProxyOptions,
//     RequestHandler as ProxyRequestHandler,
//     createProxyMiddleware as ProxyMiddleware,
// } from 'http-proxy-middleware';


// export abstract class AbstractExternalProcessManager<
//     ProcessRefT,
//     ProcessSpecT extends ExternalProcessSpec,
// > implements IProcessManager<ProcessRefT, ProcessSpecT> {
//     abstract query(ref: ProcessRefT): Promise<ProcessSpecT>;

//     async serve(ref: ProcessRefT) {
//         const spec = await this.query(ref);
//         if (spec.proxyOptions == null)
//             throw new Error(
//                 `Process cannot be proxied due to missing proxyOptions in ${spec}`
//             );
//         return ProxyMiddleware(spec.proxyOptions);
//     }
// }

