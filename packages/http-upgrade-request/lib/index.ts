import { IncomingMessage, RequestListener, ServerResponse } from "node:http";
import { Socket } from "node:net";

declare module "node:http" {
    interface ServerResponse {
        upgrade?: {
            head: Buffer,
        };
    }
}

export function UpgradeListener(requestListener: RequestListener) {
    return (req: IncomingMessage, socket: Socket, head: Buffer) => {
        const res = new ServerResponse(req);

        res.assignSocket(socket);
        res.upgrade = { head };

        return requestListener(req, res);
    };
}
