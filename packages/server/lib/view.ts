import Express from "express";


export interface ViewLocals extends Express.Locals {
    routes: {
        api: string;
        view: string;
        applet?: string | null;
    };
}

export type ViewRequestHandler = Express.RequestHandler<
    {}, any, any, any, ViewLocals
>;

export interface IView extends ViewRequestHandler {
    onUnauthorized?: ViewRequestHandler;
}