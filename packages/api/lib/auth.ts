import { oc } from "@orpc/contract";
import { z } from "zod";


export const AuthType = z.enum(["password"]);
export type AuthType = z.infer<typeof AuthType>;

const AuthInfoBase = z.object({
    type: AuthType,
    ref: z.string(),
    displayName: z.string().optional(),
    description: z.string().optional(),
});

export const AuthInfo = z.discriminatedUnion(
    "type", [
        AuthInfoBase.extend({
            type: z.literal("password"),
        })
    ]
);
export type AuthInfo = z.infer<typeof AuthInfo>;

const AuthInputBase = z.object({
    type: AuthType,
    ref: z.string(),
});

// TODO
export const AuthInput = z.discriminatedUnion(
    "type", [
        AuthInputBase.extend({
            type: z.literal("password"),
            ref: z.string(),
            username: z.string(),
            password: z.string(),
        }),
    ]
)
export type AuthInput = z.infer<typeof AuthInput>;

export const AuthAPIContract = {
    info: oc.output(
        z.object({
            version: z.literal(0),
            callbacks: z.array(AuthInfo),
        })
    ),
    callback: oc.input(AuthInput).errors({
        UNAUTHORIZED: {}
    }),
};

