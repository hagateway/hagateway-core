import React from "react";
import ReactDOM from "react-dom/client";


function useApp(document: Document = global.document) {
    // TODO
    const configElement = document.querySelector("script#config");
    if (configElement == null)
        throw new Error("Config element not found");

    if (configElement.textContent == null)
        throw new Error("Config element has no content");
    const config = global.JSON.parse(configElement.textContent);
    // TODO
    // ...

    const rootElement = document.getElementById("root");
    if (rootElement == null)
        throw new Error("Root element not found");
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          {/* <App config={config} /> */}
        </React.StrictMode>,
    );
}

useApp();