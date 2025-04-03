import Express from "express";


export interface ViewLocals extends Express.Locals {
    baseApiPath: string;
    baseViewPath: string;
}

export type ViewRequestHandler = Express.RequestHandler<
    {}, any, any, any, ViewLocals
>;

export interface IView extends ViewRequestHandler {
    onUnauthorized?: ViewRequestHandler;
}