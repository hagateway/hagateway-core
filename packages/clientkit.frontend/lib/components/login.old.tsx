import React from "react";
import * as P from "@patternfly/react-core";
import * as PIcons from "@patternfly/react-icons";
import "@patternfly/react-core/dist/styles/base.css";
// TODO
import { AuthScheme, AuthInfo } from "@wagateway/server/lib/auth.old";

import { Select, SelectList, SelectOption } from "./ui/select";


export interface AuthDialogProps {
  nextPathHint?: string | null;
  baseApiPath: string;
  authRef: string;
  onAuthSuccess?: (nextPath: string | null) => Promise<void>;
}

export interface AuthDialogConstructor {
  (props: AuthDialogProps): React.ReactNode;
  scheme: AuthScheme;
}


export interface LoginScreenProps {
  nextPathHint?: string | null;
  baseApiPath: string;
  authDialogConstructors?: AuthDialogConstructor[];
}

export const LoginScreen: React.FunctionComponent<LoginScreenProps> 
= (props) => {
  // TODO optimize
  const authDialogConstructorMap = new Map<AuthScheme, AuthDialogConstructor>(
    [
      PasswordAuthDialog,
      ...(props.authDialogConstructors ?? [])
    ]
    .map((constructor) => [constructor.scheme, constructor])
  );

  // TODO typing!!!!
  const [authInfos, setAuthInfos] = React.useState<Record<string, AuthInfo>>();
  // TODO
  


  React.useEffect(() => {
    fetch(`${props.baseApiPath}/auth/callbacks`)
      .then((resp) => resp.json())
      .then((data) => {
        // TODO
        setAuthInfos(data?.body);
      });
  }, [props.baseApiPath]);

  // TODO
  const [authRef, setAuthRef] = React.useState<string | null>();
  React.useEffect(() => {
    if (authInfos != null) {
      setAuthRef(Object.keys(authInfos)[0]);
    }
  }, [authInfos]);

  const AuthDialog = (
    authInfos != null && authRef != null
    ? authDialogConstructorMap.get(authInfos?.[authRef]?.scheme)
    : null
  );
  return (
    <P.LoginPage
      headerUtilities={
        <Select
          autoClose={true}
          label={authRef != null ? authInfos?.[authRef]?.displayName : null}
          aria-label="Select an authentication method."
          selection={authRef}
          onSelect={(value) => { setAuthRef(value); }}
        >
          <SelectList>{
            Object.entries(authInfos ?? {})
            .map(([authRef, authInfo]) => <SelectOption key={authRef} value={authRef}>{
              authInfo.displayName ?? authInfo.ref ?? authRef
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
      AuthDialog != null && authRef != null
      ? <AuthDialog
        baseApiPath={props.baseApiPath}
        authRef={authRef}
        onAuthSuccess={async (nextPath) => {
          // TODO
          console.log("TODO", "onAuthSuccess");
          //
          if (nextPath != null)
            window.location.href = nextPath;
        }}
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
        // TODO !!!!!
        const resp = await fetch(
          `${props.baseApiPath}/auth/callbacks/${props.authRef}`, 
          { 
            method: "POST", 
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }), 
          },
        );
        const data = await resp.json();
        switch (data?.type) {
          case "error":
            setErrorMessage(
              data?.message ?? 
              "An error occurred while validating the credentials."
            );
            return;
          case "data":
            break;
          default:
            if (!resp.ok) {
              setErrorMessage("Unknown error.");
              return;
            }
            break;
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
PasswordAuthDialog.scheme = "password";
