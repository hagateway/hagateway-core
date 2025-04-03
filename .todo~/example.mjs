export default {
    kits: [
        "@wagateway/clientkit",
        "@wagateway/serverkit-linux", 
        "@wagateway/serverkit-vscode",
    ],
    // net: "/run/wagateway/app.sock",
    net: { host: "localhost", port: 8080 },
    auth: { 
        handlers: [
            // "pam:passwd",
            { 
                $: "pam:passwd",  
                config: { pamName: "login" }
            }
        ],
    },
    // session: { backend: "memory" },
    applet: { 
        spawners: ["vscode"], 
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
};