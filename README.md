# hagateway-core

## TODOs


- get user info - real name... over dbus

- orpc error handling - console output??

- waitForFile bug!!!! intermediate dirs not watched!!!!!

```
import chokidar from "chokidar";


export async function waitForFile(
    filePath: string,
    options?: { signal?: AbortSignal },
): Promise<void> {
    return new Promise((resolve, reject) => {
        const watcher = chokidar.watch(
            filePath, {
                persistent: true,
                ignoreInitial: false,
            }
        )
        .on("add", () => { watcher.close(); resolve(); })
        .on("error", (error) => { watcher.close(); reject(error); });

        if (options?.signal != null) {
            const onAbort = () => {
                watcher.close();
                reject(options.signal?.reason);
            };
            if (options.signal.aborted)
                return onAbort();
            return options.signal.addEventListener(
                "abort", onAbort, { once: true }
            );
        }
    });
}

```


- multiple listeners

```
npm install
npm run build --workspaces
npx @hagateway/server serve '{"context": {"runtimeDirectory": "/tmp/todo"}}' '{"include": "./.temp/example.mjs"}'
npm --workspace=packages/server start -- serve '{"context": {"runtimeDirectory": "/tmp/todo"}}' '{"include": "./.temp/example.mjs"}'

```

```
npm version prerelease --preid=alpha
```

```
        "build": "yarn workspaces foreach --topological run build",
        "prepare": "yarn run build",
        "release": "yarn workspaces foreach --topological --no-private npm publish --access public"
```


- wait until unix socket available
- TODO check if config permission too open

- offer default `config`
- `crypto.randomBytes(32)` for secret

- doc esm req for all kits and modules
- `req.baseUrl` X-Forwarded-Prefix
- client: check if link secure
- // TODO check if user is the proc user?
- `  "bin": "dist/src/cli.js",`
- custom routes
- success redirect
- session backend!!!!!

- TODO presets { "include": "@wagateway/preset-linux" }
- TODO loginctl sessions


- TODO migrate to hono 
    - https://github.com/orgs/honojs/discussions/3588#discussioncomment-11503846


```
import { eventIterator } from '@orpc/server'
    // subscribe: oc.output(
    //     eventIterator(z.object({
    //     }))
    // ),
```


```javascript


    /*


    const app = App({
        authManager: new AuthManager()
            .use(PAMPasswdAuthHandler()),
        sessionManager: new SessionManager(),
        appletManager: new SystemdAppletManager()
            .use(VSCodeSpawner()),
    });

    app.portal.useView();



    const appCli = AppCli();
    appCli.useKit("@wagateway/serverkit-linux");
    appCli.useKit("@wagateway/serverkit-vscode");
    // or appCli.useKit(require("@wagateway/serverkit-vscode"));
    appCli.run({
        kits: [
            "@wagateway/clientkit",
            "@wagateway/serverkit-linux", 
            "@wagateway/serverkit-vscode",
        ],
        net: "/run/wagateway/app.sock",
        // net: { host: "localhost", port: 8080 },
        auth: { 
            backends: [
                // "pam:passwd",
                // PAMPasswdHandler(),
                { 
                    $: "pam:passwd",  
                    config: { pamName: "login" }
                }
            ],
        },
        session: { backend: "memory" },
        applet: { 
            backend: "vscode", 
            // manager: "systemd",
            manager: {
                $: "systemd",
                config: {
                    pamName: "login",
                    baseUnitName: "vscode.wagateway",
                },
            },
        },
        view: "default",
    });

    


    // wagateway --auth.backend pam:passwd --session.backend memory --applet.backend vscode --applet.manager systemd



    */


```