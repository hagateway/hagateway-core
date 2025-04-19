import React from "react";
import ReactDOM from "react-dom/client";

import { Config } from "../index";
// TODO
import { LoginScreen } from "../lib/components/login";


// TODO
// export const App: React.FunctionComponent<Config> = (config) => {
// };

// TODO
import { AppAPIContract } from "@wagateway/api/dist/lib/app";
import { ContractRouterClient } from "@orpc/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

function useApp(
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

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <LoginScreen
                apiClient={apiClient}
                onAuthSuccess={async () => {
                    window.location.href = params.get("next") ?? config.routes.view;
                }}
            />
        </React.StrictMode>,
    );
}

useApp();