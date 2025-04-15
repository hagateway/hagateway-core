export declare const path: string;

export interface Config {
    basePath: string;
    routes: {
        api: string;
        view: string;
        applet?: string | null;
    };
}