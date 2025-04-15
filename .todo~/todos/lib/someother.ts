import { Hono } from "hono";

export const someOtherApp = new Hono();
someOtherApp.get("/some/other/path", async (c) => {
    return c.text("Hello from some other path");
});


