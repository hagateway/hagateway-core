import { IKit } from "@hagateway/server/dist/src";

import { VSCodeAppletSpawner } from "../lib";


export default ((registry) => {
    registry.applet.spawners.set(
        "vscode",
        async () => {
            return await VSCodeAppletSpawner();
        },
    );
}) as IKit;