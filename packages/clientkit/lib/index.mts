import Path from "node:path";
import Fs from "node:fs/promises";
import Express from "express";
import ExpressSlashes from "connect-slashes";
import { JSDOM } from "jsdom";
import { IView, ViewRequestHandler } from "@wagateway/server/dist/lib/view";
import * as Frontend from "@wagateway/clientkit.frontend";


export function View(): IView {
    const app = Express() satisfies IView;
    app.set("strict routing", true);

    app.get("/",
        ExpressSlashes(),
        (async (req, res) => {
            const f = Path.join(Frontend.path, "index.html");
            const dom = new JSDOM(await Fs.readFile(f, "utf8"));

            const configElement = dom.window.document.querySelector("script#config");
            if (configElement != null) {
                configElement.textContent = JSON.stringify({
                    basePath: req.baseUrl,
                    routes: res.locals.routes,
                } satisfies Frontend.Config);
            }

            res.send(dom.serialize());
        }) satisfies ViewRequestHandler
    );
    // TODO
    app.use(Express.static(Frontend.path));

    (app as IView).onUnauthorized = (req, res) => {
        res.redirect([
            res.locals.routes.view,
            new URLSearchParams([
                ["next", req.url],
            ]).toString()
        ].join("?"));
    };

    // TODO 

    return app;
}