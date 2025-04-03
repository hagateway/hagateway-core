# 

## TODOs

- doc esm req for all kits and modules
- `req.baseUrl` X-Forwarded-Prefix
- client: check if link secure
- // TODO check if user is the proc user?
- `  "bin": "dist/src/cli.js",`
- custom routes
- success redirect


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