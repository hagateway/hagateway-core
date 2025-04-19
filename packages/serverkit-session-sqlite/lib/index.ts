import ExpressSession from "express-session";
import ConnectSequelize from "connect-session-sequelize";
import { Sequelize } from "sequelize";
const SequelizeStore = ConnectSequelize(ExpressSession.Store);
import { SessionManager } from "@hagateway/server/dist/lib/session";


export class SQLiteSessionManager extends SessionManager {
    constructor(config: {
        secret?: string | string[] | null;
        database: string;
        databaseOptions?: {
            // TODO support more options
            logging?: boolean;
        };
    }) {
        // TODO
        const store = new SequelizeStore({
            db: new Sequelize({
                dialect: "sqlite",
                storage: config.database,
                logging: config.databaseOptions?.logging ?? false,
            }),
        });
        store.sync();

        super({
            // TODO !!!!!!!!
            secret: config.secret ?? null,
            store,
        });
    }
}