
import React from 'react';
import * as P from '@patternfly/react-core';
import * as PIcons from "@patternfly/react-icons";
import "@patternfly/react-core/dist/styles/base.css";


export const ConfirmModal = () => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent) => {
        setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
    };

    return (
        <P.Modal
            variant="small"
            isOpen={isModalOpen}
            onClose={handleModalToggle}
            aria-labelledby="scrollable-modal-title"
            aria-describedby="modal-box-body-scrollable"
        >
            <P.ModalHeader title="Modal with overflowing content" labelId="scrollable-modal-title" />
            <P.ModalBody tabIndex={0} id="modal-box-body-scrollable" aria-label="Scrollable modal content">
                Very dangerous action.
            </P.ModalBody>
            <P.ModalFooter>
                <P.Button key="confirm" variant="danger">
                    Kill Applet
                </P.Button>
                <P.Button key="cancel" variant="link" onClick={handleModalToggle}>
                    Cancel
                </P.Button>
            </P.ModalFooter>
        </P.Modal>
    );
};


import { ContractRouterClient } from "@orpc/contract";
import { AppAPIContract } from "@hagateway/api/dist/lib/app";
import { safe } from "@orpc/client";


export interface DashboardScreenProps {
    apiClient: ContractRouterClient<typeof AppAPIContract>;
    onLogoutSuccess?: () => Promise<void>;
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
                <P.Flex columnGap={{ default: "columnGapSm" }}>
                    <P.Button variant="primary" onClick={async (event) => {
                        event.preventDefault();

                        const { error } = await safe(
                            props.apiClient.sessionManager.instance.destroy({})
                        );
                        if (error != null) {
                            // TODO !!!!!!!
                            console.error("Logout failed", error);
                            return;
                        }

                        await props.onLogoutSuccess?.();
                    }}>Logout</P.Button>
                    {/* <P.Button variant="danger">Kill Applet</P.Button> */}
                    {/* <P.Button variant="secondary">Start Applet</P.Button>
                    <P.Button variant="link" icon={<P.ArrowRightIcon />} iconPosition="end">
                    Proceed to <strong>Application</strong>
                    </P.Button> */}
                </P.Flex>
            </P.LoginPage>
        );
    };
