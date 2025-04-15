// import { initTRPC, AnyTRPCRouter } from '@trpc/server';
// import * as trpcExpress from '@trpc/server/adapters/express';

// const createContext = (ctx: trpcExpress.CreateExpressContextOptions) => (ctx); // no context
// type Context = Awaited<ReturnType<typeof createContext>>;


const trpc = initTRPC.context().create();


// 
const appRouter = trpc.router({

    todos: trpc.procedure.subscription(async function* (opts) {
        opts.ctx
    }),
})

trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: (ctx) => ctx,
})



function AuthMiddleware() {
    const trpc = initTRPC.create();

    return trpcExpress.createExpressMiddleware({
        router: trpc.router({
            enumerate: trpc.procedure.query(() => {}),
            
        }),
    });
}


import { initTRPC, AnyTRPCRouter, TRPCBuilder } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";


function ExpressTRPCApp<
    RouterT extends AnyTRPCRouter,
    ContextT extends object,
    MetaT extends object,
>(config: {
    createRouter: (trpc: TRPCBuilder<ContextT, MetaT>) => RouterT;
}) {
    const trpc = initTRPC.context<ContextT>().meta<MetaT>().create();

    return trpcExpress.createExpressMiddleware({
        router: config.createRouter(trpc),
        createContext: (ctx) => {
            // TODO !!!!!!
            return ctx;
        },
    });
}