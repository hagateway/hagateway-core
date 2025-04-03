import { IKit } from "@wagateway/server/src";

import { View } from "../lib/index.mts";


export default ((registry) => {
    registry.views.set(
        "default",
        async () => {
            return View();
        },
    )
}) as IKit;
