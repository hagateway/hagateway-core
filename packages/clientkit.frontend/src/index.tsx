import React from "react";
import ReactDOM from "react-dom/client";

// TODO
import { AppAPIContract } from "@hagateway/api/dist/lib/app";
import { ContractRouterClient } from "@orpc/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

import { Config } from "../index";
// TODO
import { LoginScreen } from "../lib/components/login";
import { DashboardScreen } from "../lib/components/dashboard";


export const Screen: React.FunctionComponent<{
    apiClient: ContractRouterClient<typeof AppAPIContract>;
    onLoginSuccess?: () => Promise<void>;
    onLogoutSuccess?: () => Promise<void>;
}> = (props) => {
    const [shouldLogin, setShouldLogin] = React.useState<boolean>();

    React.useEffect(() => {
        // TODO error handling
        props.apiClient.sessionManager.instance.has({})
            .then((v) => { setShouldLogin(!v); });
    }, [props.apiClient]);

    // TODO
    if (shouldLogin == null)
        return null;

    if (!shouldLogin)
        return <DashboardScreen
            apiClient={props.apiClient}
            onLogoutSuccess={async () => {
                setShouldLogin(true);
                await props.onLogoutSuccess?.();
            }}
        />;

    return <LoginScreen
        apiClient={props.apiClient}
        onAuthSuccess={async () => {
            await props.onLoginSuccess?.();
        }}
    />;
};


export function render(
    document: Document = window.document
) {
    // TODO
    const configElement = document.querySelector("script#config");
    if (configElement == null)
        throw new Error("Config element not found");

    if (!configElement.textContent)
        throw new Error("Config element has no content");
    const config: Config = JSON.parse(configElement.textContent);
    // TODO zod validate??
    // TODO
    // ...

    // TODO
    const params = new URLSearchParams(document.location.search);

    const rootElement = document.getElementById("root");
    if (rootElement == null)
        throw new Error("Root element not found");

    const apiClient: ContractRouterClient<typeof AppAPIContract> 
        = createORPCClient(new RPCLink({
            url: new URL(config.routes.api, document.baseURI),
        }));

    // TODO
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <Screen 
                apiClient={apiClient}
                onLoginSuccess={async () => {
                    window.location.href 
                        = params.get("next") ?? config.routes.view;
                }}
                onLogoutSuccess={async () => {
                    // TODO reload
                    // window.location.href = params.get("next") ?? config.routes.auth;
                }}
            />
        </React.StrictMode>,
    );
}

render();