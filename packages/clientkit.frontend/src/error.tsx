import React from "react";
import ReactDOM from "react-dom/client";
import * as PGroup from "@patternfly/react-component-groups";
import "@patternfly/react-core/dist/styles/base.css";


export function render(window: Window) {
    // TODO
    const rootElement = window.document.getElementById("root");
    if (rootElement == null)
        throw new Error("Root element not found");

    // TODO
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <PGroup.ErrorState 
                titleText="An error occurred" 
            />
        </React.StrictMode>,
    );
}

render(window);