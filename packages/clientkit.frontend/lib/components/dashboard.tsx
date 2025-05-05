
import React from "react";
import * as P from "@patternfly/react-core";
import * as PIcons from "@patternfly/react-icons";
import "@patternfly/react-core/dist/styles/base.css";
import { AppletState } from "@hagateway/api/dist/lib/applet";

import { ActionButton } from "./ui/action";


export interface AppletControlPanelProps {
    apiClient: ContractRouterClient<typeof AppAPIContract>;
}

export const AppletControlPanel = (props: AppletControlPanelProps) => {
    const errorHandler = useErrorHandler();

    const [appletState, setAppletState] = React.useState<AppletState>();
    const [modal, setModal] = React.useState<React.ReactNode>();

    React.useEffect(() => {
        const todo = async () => {
            const api = props.apiClient.appletManager.instance;
            try {
                setAppletState(await api.getState({}));
                for await (const state of await api.onStateChange({})) {
                    setAppletState(state);
                }                
            } catch (error) {
                errorHandler(error);
            }
        };
        todo();
    }, [props.apiClient]);

    const startApplet = async () => {
        await props.apiClient.appletManager.instance.create({});
    };

    const killApplet = async () => {
        setModal(
            <ConfirmModal
                title="Kill Applet"
                body={<>
                    Are you sure you want to terminate the applet? 
                    Any unsaved data may be lost, and connected services may become unresponsive.
                </>}
                confirmText="Kill Applet"
                cancelText="Cancel"
                onConfirm={async () => {
                    await props.apiClient.appletManager.instance.destroy({});
                    setModal(null);
                }}
                isOpen={true}
                onClose={() => {
                    setModal(null);
                }}
            />
        );
    };

    var button: React.ReactNode = null;
    switch (appletState) {
        case "unknown":
            button = <ActionButton isDisabled isLoading>
                Applet Unavailable
            </ActionButton>;
            break;
        case "active":
            button = <ActionButton variant="danger" onClick={killApplet}>
                Kill Applet
            </ActionButton>;
            break;
        case "reloading":
            button = <ActionButton isDisabled isLoading>
                Reloading Applet
            </ActionButton>;
            break;
        case "inactive":
            button = <ActionButton
                variant="primary"
                onClick={startApplet}
            >
                Start Applet
            </ActionButton>
            break;
        case "failed":
            button = <ActionButton variant="warning" onClick={startApplet}>
                Start Applet
            </ActionButton>;
            break;
        case "activating":
            button = <ActionButton isDisabled isLoading>
                Starting Applet
            </ActionButton>;
            break;
        case "deactivating":
            button = <ActionButton isDisabled isLoading>
                Stopping Applet
            </ActionButton>;
            break;
        default:
            break;
    }

    return <>
        <P.Flex>
            {button}
        </P.Flex>
        {modal}
    </>;
};


import { ContractRouterClient } from "@orpc/contract";
import { AppAPIContract } from "@hagateway/api/dist/lib/app";
import { safe } from "@orpc/client";
import { ConfirmModal } from "./ui/confirm";
import { useErrorHandler } from "./ui/error";


export interface DashboardScreenProps {
    apiClient: ContractRouterClient<typeof AppAPIContract>;
    onLogoutSuccess?: () => Promise<void>;
    onProceed?: () => Promise<void>;
}

export const DashboardScreen: React.FunctionComponent<DashboardScreenProps>
    = (props: DashboardScreenProps) => {
        return (
            <P.LoginPage
                //   brandImgSrc={brandImg}
                //   brandImgAlt="PatternFly logo"
                // footerListVariants={ListVariant.inline}
                // footerListItems={listItem}
                // textContent="This is placeholder text only. Use this area to place any information or introductory message about your application that may be relevant to users."
                // loginTitle={
                //   <>
                //     Welcome! <strong>Anon</strong>.
                //   </>
                // }
                loginTitle="Welcome!"
                loginSubtitle="You are already logged in. Select an action below."
            >
                <P.Flex direction={{ default: "column" }}>
                    <P.Flex>
                        <ActionButton variant="primary" onClick={async () => {
                            const { error } = await safe(
                                props.apiClient.sessionManager.instance.destroy({})
                            );
                            if (error != null) {
                                // TODO !!!!!!!
                                throw error;
                            }

                            await props.onLogoutSuccess?.();
                        }}>Log out</ActionButton>
                        <ActionButton
                            variant="link"
                            icon={<PIcons.ArrowRightIcon />}
                            iconPosition="end"
                            onClick={async () => {
                                await props.onProceed?.();
                            }}
                        >
                            Proceed to <strong>Application</strong>
                        </ActionButton>
                    </P.Flex>
                    <P.ExpandableSection
                        toggleTextExpanded="Hide advanced options"
                        toggleTextCollapsed="Show advanced options"
                    >
                        <AppletControlPanel apiClient={props.apiClient} />
                    </P.ExpandableSection>
                </P.Flex>
            </P.LoginPage>
        );
    };
