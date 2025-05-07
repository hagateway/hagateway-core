import DataURI from "datauri";
import { IAppletSpawner } from "@hagateway/server/dist/lib/applet";


export async function VSCodeAppletSpawner(): Promise<IAppletSpawner> {
    return {
        info: {
            ref: "vscode",
            displayName: "Code",
            // TODO 
            displayIcon: await DataURI(
                require.resolve("@hagateway/serverkit-applet-vscode/res/vscode.svg")
            ),
            description: "Visual Studio Code",
        },
        callback: async (_, {spec, useProxy, useProcess}) => {
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
                    // "--server-base-path", spec.baseUrl,
                    "--socket-path", proxySpec.transport.socketPath,
                    // "--verbose", "--log", "trace",
                ],
            });
        },
        // TODO https://github.com/microsoft/vscode/pull/210455
        onRequest: (req, _res, next) => {
            req.headers["X-Forwarded-Prefix"] = req.baseUrl;
            next();
        },
    };
}
