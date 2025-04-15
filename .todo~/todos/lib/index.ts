import { Hono } from "hono";

import { someOtherApp } from "./someother";

const app = new Hono();
app.use("/some/path", async (c) => {});
app.route("/some/other/path", someOtherApp);



export type AppType = typeof app;
