import { Hono } from "hono";

export function AuthMiddleware() {
    const app = new Hono();
    app.get("/auth", (c) => {
        return c.json({ type: "data", version: "1.0.0" });
    });
    return app;
}

// TODO
export type AuthMiddleware = ReturnType<typeof AuthMiddleware>;
