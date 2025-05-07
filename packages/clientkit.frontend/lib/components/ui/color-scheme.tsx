import React from "react";


export type ColorScheme = "light" | "dark";

export interface UseColorSchemeProps {
    window?: Window | null;
}

export const useColorScheme 
= (props?: UseColorSchemeProps): ColorScheme | null => {
    const window = props?.window ?? globalThis.window;

    const [scheme, setScheme] = React.useState<ColorScheme>();

    for (const schemeQuery of (["light", "dark"] satisfies ColorScheme[])) {
        React.useEffect(() => {
            const query = window.matchMedia(
                `(prefers-color-scheme: ${schemeQuery})`
            );
            const handleChange = () => {
                if (query.matches)
                    setScheme(schemeQuery);
            };

            handleChange();
            query.addEventListener("change", handleChange);
            return () => query.removeEventListener("change", handleChange);
        }, [window]);
    }

    return scheme ?? null;
};


import "@patternfly/react-core/dist/styles/base.css";

export interface ColorSchemeProviderProps {
    window?: Window | null;
}

export const ColorSchemeProvider
: React.FunctionComponent<ColorSchemeProviderProps> 
= ({ window }) => {
    const theme = useColorScheme({ window });
    React.useEffect(() => {
        const document = window?.document ?? globalThis.document;
        document.documentElement.classList
        .toggle("pf-v6-theme-dark", theme === "dark");
    }, [theme]);

    return null;
};