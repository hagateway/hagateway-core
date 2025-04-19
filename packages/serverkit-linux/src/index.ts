import Z from "zod";
import { IKit } from "@hagateway/server/dist/src";

import { SystemdAppletManager } from "../lib/applet-systemd";
import { PAMPasswdAuthProvider } from "../lib/auth-pam";


const systemdAppletManagerSchema = Z.object({
    dbus: 
        Z.union([
            Z.literal("system"),
            Z.literal("session"),
            // TODO custom
        ])
        .default("system")
        .describe(
            "The DBus session to use for communicating with systemd. "
            + "If `system`, this talks to the system instance of systemd. "
            + "If `session`, this talks to the user instance of systemd. "
            + "Refer to systemd(1) for details."
        ),
    baseUnitName: 
        Z.string()
        .refine(name => {
            if (!/^[a-zA-Z0-9._-]+$/.test(name))
                console.warn(
                    `Base unit name with special characters detected, `
                    + `attempts to use it in systemd may fail: ${name}.`
                );
            return true;
        })
        .describe(
            "Unique (preferably) base unit name to use for systemd units. "
            + "This name will be used as a suffix for all systemd units. "
            + "For example, if the base unit name is `base`, "
            + "the systemd unit names will always end with `base.service`."
        ),
    pamName: 
        Z.string()
        .optional()
        .describe(
            "PAM service name to use for systemd units. "
            + "A common choice is `login` for login sessions. "
            + "If unspecified, PAM will not be used for systemd units. "
            + "Refer to systemd.exec(5) `PAMName=` for more details."
        ),
});

const pamAuthHandlerSchema = Z.object({
    pamName: 
        Z.string()
        .describe(
            "PAM service name to use for authentication. "
            + "A common choice is `login` for login sessions. "
            + "Refer to pam.d(5) `service` for more details."
        ),
});

export default ((registry) => {
    registry.applet.managers.set(
        "systemd",
        async (config) => {
            return new SystemdAppletManager(
                systemdAppletManagerSchema.parse(config),
            );
        }
    );

    registry.auth.providers.set(
        "pam:passwd",
        async (config) => {
            return PAMPasswdAuthProvider(
                pamAuthHandlerSchema.parse(config),
            );
        }
    );
}) as IKit;
