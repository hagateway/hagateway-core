import { IAppletSpawner } from "@wagateway/server/lib/applet";


export function VSCodeAppletSpawner(): IAppletSpawner {
    const spawner: IAppletSpawner = async (_, {spec, useProxy, useProcess}) => {
        if (useProxy == null)
            throw new Error("TODO");
        if (useProcess == null)
            throw new Error("TODO");

        const proxySpec = await useProxy({ 
            transport: {
                protocol: "unix",
            },
        });

        if (proxySpec.transport.socketPath == null)
            throw new Error("TODO");
        await useProcess({
            execPath: "code",
            execArgv: [
                "code",
                "serve-web",
                "--accept-server-license-terms",
                "--without-connection-token",
                // TODO
                "--server-base-path", spec.baseUrl,
                "--socket-path", proxySpec.transport.socketPath,
                "--verbose", "--log", "trace",
            ],
        });
    };
    // TODO https://github.com/microsoft/vscode/pull/210455
    spawner.onRequest = (req, _res, next) => {
        req.headers["X-Forwarded-Prefix"] = req.baseUrl;
        next();
    };

    return spawner;
}
