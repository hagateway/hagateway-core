import { IKit } from "@hagateway/server/dist/src";

import { VSCodeAppletSpawner } from "../lib";


export default ((registry) => {
    registry.applet.spawners.set(
        "vscode",
        async () => {
            return VSCodeAppletSpawner();
        },
    );
}) as IKit;