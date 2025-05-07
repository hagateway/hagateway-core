import React from "react";
import ReactDOM from "react-dom/client";

// TODO
import { AppAPIContract } from "@hagateway/api/dist/lib/app";
import { ContractRouterClient } from "@orpc/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

import { Config } from "../index";

// TODO
import { LoginPage } from "../lib/components/page-login";
import { DashboardPage } from "../lib/components/page-dashboard";


import * as PGroup from "@patternfly/react-component-groups";
import "@patternfly/react-core/dist/styles/base.css";
import { ColorSchemeProvider } from "../lib/components/ui/color-scheme";


export interface ErrorBoundaryProps {
    children?: React.ReactNode;
}

export const ErrorBoundary
: React.FunctionComponent<ErrorBoundaryProps> 
= (props) => {
    return <PGroup.ErrorBoundary 
        errorTitle="Something wrong happened"
        children={props.children} 
    />;
};


export const Screen: React.FunctionComponent<{
    apiClient: ContractRouterClient<typeof AppAPIContract>;
    onLoginSuccess?: () => Promise<void>;
    onLogoutSuccess?: () => Promise<void>;
    onProceed?: () => Promise<void>;
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
        return <DashboardPage
            apiClient={props.apiClient}
            onLogoutSuccess={async () => {
                setShouldLogin(true);
                await props.onLogoutSuccess?.();
            }}
            onProceed={props.onProceed}
        />;

    return <LoginPage
        apiClient={props.apiClient}
        onAuthSuccess={async () => {
            await props.onLoginSuccess?.();
            setShouldLogin(false);
        }}
    />;
};

export const App: React.FunctionComponent<{
    window: Window;
}> = ({ window }) => {
    const document = window.document;

    React.useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                // TODO
                window.location.reload();
            }
        };
        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, [window]);

    const configElement = document.querySelector("script#config");
    if (configElement == null)
        throw new Error("Config element not found");

    if (!configElement.textContent)
        throw new Error("Config element has no content");
    const config: Config = JSON.parse(configElement.textContent);
    // TODO zod validate??
    // TODO
    // ...

    const rootElement = document.getElementById("root");
    if (rootElement == null)
        throw new Error("Root element not found");

    const apiClient: ContractRouterClient<typeof AppAPIContract>
        = createORPCClient(new RPCLink({
            url: new URL(config.routes.api, document.baseURI),
        }));

    const [isInProgress, setIsInProgress] = React.useState<boolean>(false);

    const onProceed = async () => {
        // TODO
        const params = new URLSearchParams(document.location.search);
        const nextPath = params.get("next") ?? config.routes.applet;
        if (nextPath != null) {
            document.location.href = nextPath;
            setIsInProgress(true);
        }
    };

    if (isInProgress)
        return null;

    return <Screen
        apiClient={apiClient}
        onLoginSuccess={async () => {
            // TODO
            await onProceed();
        }}
        onLogoutSuccess={async () => {
            // TODO reload
            // window.location.href = params.get("next") ?? config.routes.auth;
        }}
        onProceed={onProceed}
    />;
};


export function render(window: Window) {
    // TODO
    const rootElement = window.document.getElementById("root");
    if (rootElement == null)
        throw new Error("Root element not found");

    // TODO
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <ErrorBoundary>
                <ColorSchemeProvider />
                <App window={window} />
            </ErrorBoundary>
        </React.StrictMode>,
    );
}

render(window);