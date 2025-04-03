import Express from "express";
import { IView } from "@wagateway/server/lib/view";

import frontendConfig from "../frontend/config.ts";


export interface RenderOptions {
    config: {
        baseResPath: string;
        baseApiPath: string;
    };
}

export function View(): IView {
    const app = Express();

    // TODO
    app.set("views", frontendConfig.viewsPath);
    app.set("view engine", "ejs");

    app.get(
        "/",
        (req, res) => {
            res.render("index", { 
                config: {
                    baseResPath: req.baseUrl,
                    baseApiPath: res.locals.baseApiPath,
                },
            } as RenderOptions);
        },
    );

    return app;
}