import Path from "node:path";

import { IKit } from "@hagateway/server/dist/src";
import { SQLiteSessionManager } from "../lib";


// TODO !!!!!
export default ((registry) => {
    // TODO
    registry.session.managers.set(
        "sqlite",
        // TODO !!!!!! zod schema!!!!!!
        async (config: any) => {
            // TODO
            return new SQLiteSessionManager({
                secret: config.secret,
                database: Path.resolve(
                    config?.context.baseDirectory ?? ".", 
                    config.database,
                ),
                databaseOptions: {
                    logging: config.databaseOptions ?? false,
                },
            });
        },
    );
}) as IKit;