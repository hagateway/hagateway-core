declare const config: {
    viewsPath: string;
};

export default config;

export interface RenderOptions {
    config: {
        baseResPath: string;
        baseApiPath: string;
    };
}