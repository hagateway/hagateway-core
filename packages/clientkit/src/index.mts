import { IKit } from "@hagateway/server/dist/src";

import { View } from "../lib/index.mts";


export default ((registry) => {
    registry.views.set(
        "default",
        async () => {
            return View();
        },
    )
}) as IKit;
