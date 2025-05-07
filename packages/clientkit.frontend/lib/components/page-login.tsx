import React from "react";
import * as P from "@patternfly/react-core";
import * as PIcons from "@patternfly/react-icons";
import "@patternfly/react-core/dist/styles/base.css";
import { ContractRouterClient } from "@orpc/contract";
import { safe } from "@orpc/client";
import { AppAPIContract } from "@hagateway/api/dist/lib/app";
import { AuthType, AuthInfo } from "@hagateway/api/dist/lib/auth";

import { Select, SelectList, SelectOption } from "./ui/select";
import { AppletSpawnerInfo } from "@hagateway/api/dist/lib/applet";
import { Page, PageMainBody, PageMainHeader } from "./page";


// TODO
export interface AuthDialogProps {
    authRef: string;
    apiClient: ContractRouterClient<typeof AppAPIContract>;
    onAuthSuccess?: () => Promise<void>;
}

export interface AuthDialogConstructor {
    type: AuthType;
    // TODO
    (props: AuthDialogProps): React.ReactNode;
}


export interface LoginPageProps {
    apiClient: ContractRouterClient<typeof AppAPIContract>;
    onAuthSuccess?: () => Promise<void>;
    authDialogConstructors?: AuthDialogConstructor[];
}

export const LoginPage: React.FunctionComponent<LoginPageProps>
    = (props) => {
        // TODO optimize
        const authDialogConstructorMap = new Map<AuthType, AuthDialogConstructor>(
            [
                PasswordAuthDialog,
                ...(props.authDialogConstructors ?? [])
            ].map((constructor) => [constructor.type, constructor])
        );

        const [authInfos, setAuthInfos] = React.useState<AuthInfo[]>();
        const [appletSpawnerInfo, setAppletSpawnerInfo] = React.useState<AppletSpawnerInfo>();

        React.useEffect(() => {
            // TODO
            props.apiClient.auth.info()
                .then((res) => {
                    setAuthInfos(res.callbacks);
                });
            props.apiClient.appletManager.info()
                .then((res) => {
                    setAppletSpawnerInfo(res.spawner);
                });
        }, [props.apiClient]);

        // TODO
        const [authID, setAuthID] = React.useState<any | null>();
        React.useEffect(() => {
            if (authInfos != null) {
                setAuthID(Object.keys(authInfos)[0]);
            }
        }, [authInfos]);

        const AuthDialog = (
            authInfos != null && authID != null
                ? authDialogConstructorMap.get(authInfos?.[authID]?.type)
                : null
        );

        return <Page appletSpawnerInfo={appletSpawnerInfo}>
            <PageMainHeader 
                headerUtilities={
                    <Select
                        autoClose={true}
                        label={authID != null ? authInfos?.[authID]?.displayName : null}
                        aria-label="Select an authentication method."
                        selection={authID}
                        onSelect={(value) => { setAuthID(value); }}
                    >
                        <SelectList>{
                            Object.entries(authInfos ?? {})
                                .map(([authRef, authInfo]) => <SelectOption key={authRef} value={authRef}>{
                                    authInfo.displayName ?? `${authInfo.type}: ${authInfo.ref}` ?? authRef
                                }</SelectOption>)
                        }</SelectList>
                    </Select>
                }
                title="Log in to your account"
                subtitle={<>
                    {"Enter your credentials"}
                    {
                        appletSpawnerInfo?.displayName
                        ? <>
                            {" "}{"to access"}{" "}
                            <strong>{appletSpawnerInfo?.displayName}</strong>
                        </> 
                        : null
                    }
                    {"."}
                </> as any}
            />
            <PageMainBody>{
                AuthDialog != null && authInfos?.[authID] != null
                    ? <AuthDialog
                        apiClient={props.apiClient}
                        authRef={authInfos[authID].ref}
                        onAuthSuccess={props.onAuthSuccess}
                    />
                    : null
            }</PageMainBody>
        </Page>;
    };

export const PasswordAuthDialog
    : React.FunctionComponent<AuthDialogProps> & AuthDialogConstructor
    = (props: AuthDialogProps) => {
        const [splash, setSplash] = React.useState<React.ReactNode>();
        
        const [errorMessage, setErrorMessage] = React.useState<string | null>();

        const [username, setUsername] = React.useState<string>();
        const [password, setPassword] = React.useState<string>();

        if (splash != null) {
            // TODO
            return splash;
        }

        return (
            <P.LoginForm
                helperText={errorMessage}
                helperTextIcon={<PIcons.ExclamationCircleIcon />}
                showHelperText={errorMessage != null}
                usernameLabel="Username"
                usernameValue={username}
                onChangeUsername={(_event, value) => setUsername(value)}
                passwordLabel="Password"
                passwordValue={password}
                onChangePassword={(_event, value) => setPassword(value)}
                // isShowPasswordEnabled
                loginButtonLabel="Log in"
                onLoginButtonClick={async (event) => {
                    event.preventDefault();

                    // TODO 
                    if (username == null) {
                        setErrorMessage("Username is required.");
                        return;
                    }
                    if (password == null) {
                        setErrorMessage("Password is required.");
                        return;
                    }

                    setSplash(
                        <P.Icon isInProgress>
                            <PIcons.SyncIcon />
                        </P.Icon>
                    );
                    const { error } = await safe(props.apiClient.auth.callback({
                        type: "password",
                        ref: props.authRef,
                        username, 
                        password,
                    }));
                    if (error != null) {
                        setErrorMessage(error.message);
                        setSplash(null);
                        return;
                    }

                    // TODO
                    setErrorMessage(null);
                    await props.onAuthSuccess?.();
                    setSplash(
                        <P.Icon status="success">
                            <PIcons.CheckCircleIcon />
                        </P.Icon>
                    );
                }}
            // rememberMeLabel="Keep me logged in for 30 days."
            // onChangeRememberMe={() => {}}
            />
        );
    };
PasswordAuthDialog.type = "password";
