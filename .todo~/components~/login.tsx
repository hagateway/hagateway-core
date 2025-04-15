
import {
    LoginFooterItem,
    LoginForm,
    LoginMainFooterBandItem,
    LoginMainFooterLinksItem,
    LoginPage,
    ListItem,
    ListVariant,
    Button,
    Flex,
    ActionList,
    ActionListItem,
  } from "@patternfly/react-core";
  import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
  import GoogleIcon from "@patternfly/react-icons/dist/esm/icons/google-icon";
  import GithubIcon from "@patternfly/react-icons/dist/esm/icons/github-icon";
  
  
  export const LoginPageHideShowPassword: React.FunctionComponent = () => {
    const [showHelperText, setShowHelperText] = React.useState(false);
    const [username, setUsername] = React.useState("");
    const [isValidUsername, setIsValidUsername] = React.useState(true);
    const [password, setPassword] = React.useState("");
    const [isValidPassword, setIsValidPassword] = React.useState(true);
    const [isRememberMeChecked, setIsRememberMeChecked] = React.useState(false);
  
    const handleUsernameChange = (
      _event: React.FormEvent<HTMLInputElement>,
      value: string
    ) => {
      setUsername(value);
    };
  
    const handlePasswordChange = (
      _event: React.FormEvent<HTMLInputElement>,
      value: string
    ) => {
      setPassword(value);
    };
  
    const onRememberMeClick = () => {
      setIsRememberMeChecked(!isRememberMeChecked);
    };
  
    const onLoginButtonClick = (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      event.preventDefault();
      setIsValidUsername(!!username);
      setIsValidPassword(!!password);
      setShowHelperText(!username || !password);
    };
  
    const socialMediaLoginContent = (
      <React.Fragment>
        <LoginMainFooterLinksItem>
          <Button
            variant="plain"
            aria-label="Login with Google"
            icon={<GoogleIcon />}
          />
        </LoginMainFooterLinksItem>
        <LoginMainFooterLinksItem>
          <Button
            variant="plain"
            aria-label="Login with Github"
            icon={<GithubIcon />}
          />
        </LoginMainFooterLinksItem>
      </React.Fragment>
    );
  
    const signUpForAccountMessage = (
      <LoginMainFooterBandItem>
        Need an account? <a href="https://www.patternfly.org/">Sign up.</a>
      </LoginMainFooterBandItem>
    );
  
    const forgotCredentials = (
      <LoginMainFooterBandItem>
        <a href="https://www.patternfly.org/">Forgot username or password?</a>
      </LoginMainFooterBandItem>
    );
  
    const listItem = (
      <React.Fragment>
        <ListItem>
          <LoginFooterItem href="https://www.patternfly.org/">
            Terms of Use{" "}
          </LoginFooterItem>
        </ListItem>
        <ListItem>
          <LoginFooterItem href="https://www.patternfly.org/">
            Help
          </LoginFooterItem>
        </ListItem>
        <ListItem>
          <LoginFooterItem href="https://www.patternfly.org/">
            Privacy Policy
          </LoginFooterItem>
        </ListItem>
      </React.Fragment>
    );
  
    const loginForm = (
      <LoginForm
        showHelperText={showHelperText}
        helperText="Invalid login credentials."
        helperTextIcon={<ExclamationCircleIcon />}
        usernameLabel="Username"
        usernameValue={username}
        onChangeUsername={handleUsernameChange}
        isValidUsername={isValidUsername}
        passwordLabel="Password"
        passwordValue={password}
        isShowPasswordEnabled
        onChangePassword={handlePasswordChange}
        isValidPassword={isValidPassword}
        rememberMeLabel="Keep me logged in for 30 days."
        isRememberMeChecked={isRememberMeChecked}
        onChangeRememberMe={onRememberMeClick}
        onLoginButtonClick={onLoginButtonClick}
        loginButtonLabel="Log in"
      />
    );
  
    return (
      <P.LoginPage
      //   brandImgSrc={brandImg}
      //   brandImgAlt="PatternFly logo"    
        footerListVariants={ListVariant.inline}
        footerListItems={listItem}
        textContent="This is placeholder text only. Use this area to place any information or introductory message about your application that may be relevant to users."
        loginTitle="Log in to your account"
        loginSubtitle={<>
        Enter your <strong>TODO</strong> credentials to access <strong>Application</strong>.
        </>}
        socialMediaLoginContent={socialMediaLoginContent}
        socialMediaLoginAriaLabel="Log in with social media"
        signUpForAccountMessage={signUpForAccountMessage}
        forgotCredentials={forgotCredentials}
      >
        {loginForm}
      </P.LoginPage>
    );
  };
  