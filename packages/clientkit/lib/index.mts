import Express from "express";
import { IView } from "@wagateway/server/lib/view";

import Frontend, { RenderOptions } from "@wagateway/clientkit.frontend";


export function View(): IView {
    const app = Express() satisfies IView;

    app.set("views", Frontend.viewsPath);
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

    (app as IView).onUnauthorized = (req, res) => {
        // TODO !!!!! auto redirect
        res.redirect([
            res.locals.baseViewPath,
            new URLSearchParams([
                ["next", req.url],
            ]).toString()
        ].join("?"));
    };

    // TODO 

    return app;
}