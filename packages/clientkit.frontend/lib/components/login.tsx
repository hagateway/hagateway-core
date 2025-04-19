import React from "react";
import * as P from "@patternfly/react-core";
import * as PIcons from "@patternfly/react-icons";
import "@patternfly/react-core/dist/styles/base.css";
import { ContractRouterClient } from "@orpc/contract";
import { safe } from "@orpc/client";
import { AppAPIContract } from "@wagateway/api/dist/lib/app";
import { AuthType, AuthInfo } from "@wagateway/api/dist/lib/auth";

import { Select, SelectList, SelectOption } from "./ui/select";


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


export interface LoginScreenProps {
    apiClient: ContractRouterClient<typeof AppAPIContract>;
    onAuthSuccess?: () => Promise<void>;
    authDialogConstructors?: AuthDialogConstructor[];
}

export const LoginScreen: React.FunctionComponent<LoginScreenProps>
    = (props) => {
        // TODO optimize
        const authDialogConstructorMap = new Map<AuthType, AuthDialogConstructor>(
            [
                PasswordAuthDialog,
                ...(props.authDialogConstructors ?? [])
            ].map((constructor) => [constructor.type, constructor])
        );

        const [authInfos, setAuthInfos] = React.useState<AuthInfo[]>();

        React.useEffect(() => {
            // TODO
            props.apiClient.auth.info()
                .then((res) => {
                    setAuthInfos(res.callbacks);
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
        return (
            <P.LoginPage
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
                loginTitle="Log in to your account"
                // TODO !!!!!
                loginSubtitle={<>
                    Enter your credentials to access <strong>Application</strong>.
                </> as any}
                //   brandImgSrc={brandImg}
                //   brandImgAlt="PatternFly logo"    
                // footerListVariants={ListVariant.inline}
                // footerListItems={listItem}
                // textContent="This is placeholder text only. Use this area to place any information or introductory message about your application that may be relevant to users."
                // socialMediaLoginContent={socialMediaLoginContent}
                // socialMediaLoginAriaLabel="Log in with social media"
                // signUpForAccountMessage={signUpForAccountMessage}
                // forgotCredentials={forgotCredentials}
            >{
                    AuthDialog != null && authInfos?.[authID] != null
                        ? <AuthDialog
                            apiClient={props.apiClient}
                            authRef={authInfos[authID].ref}
                            onAuthSuccess={props.onAuthSuccess}
                        />
                        : null
                }</P.LoginPage>
        );
    };

export const PasswordAuthDialog
    : React.FunctionComponent<AuthDialogProps> & AuthDialogConstructor
    = (props: AuthDialogProps) => {
        const [errorMessage, setErrorMessage] = React.useState<string | null>();

        const [username, setUsername] = React.useState<string>();
        const [password, setPassword] = React.useState<string>();

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

                    const { error } = await safe(props.apiClient.auth.callback({
                        type: "password",
                        ref: props.authRef,
                        username, 
                        password,
                    }));
                    if (error != null) {
                        setErrorMessage(error.message);
                        return;
                    }

                    // TODO
                    setErrorMessage(null);
                    // TODO !!!!!
                    await props.onAuthSuccess?.();
                }}
            // rememberMeLabel="Keep me logged in for 30 days."
            // onChangeRememberMe={() => {}}
            />
        );
    };
PasswordAuthDialog.type = "password";
