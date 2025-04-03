import "@patternfly/react-core/dist/styles/base.css";

import React from 'react';
import P from '@patternfly/react-core';

import { Button, Modal, ModalBody, ModalHeader, ModalFooter, ModalVariant, Flex, LoginPage } from '@patternfly/react-core';
import { ArrowRightIcon } from "@patternfly/react-icons";
import { Api } from "../api";

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
        <ModalHeader title="Modal with overflowing content" labelId="scrollable-modal-title" />
        <ModalBody tabIndex={0} id="modal-box-body-scrollable" aria-label="Scrollable modal content">
          Very dangerous action.
        </ModalBody>
        <ModalFooter>
          <Button key="confirm" variant="danger">
            Kill Applet
          </Button>
          <Button key="cancel" variant="link" onClick={handleModalToggle}>
            Cancel
          </Button>
        </ModalFooter>
      </P.Modal>    
  );
};


export interface DashboardPageProps {
  api: Api;
}

export const DashboardPage: React.FunctionComponent<DashboardPageProps> 
= (props: DashboardPageProps) => {
    return (
        <LoginPage
        //   brandImgSrc={brandImg}
        //   brandImgAlt="PatternFly logo"
          // footerListVariants={ListVariant.inline}
          // footerListItems={listItem}
          // textContent="This is placeholder text only. Use this area to place any information or introductory message about your application that may be relevant to users."
          loginTitle={
            <>
              Welcome! <strong>Anon</strong>.
            </>
          }
          loginSubtitle="You are already logged in. Select an action below."
        >
          <Flex columnGap={{ default: "columnGapSm" }}>
            <Button variant="primary">Logout</Button>
            {/* <Button variant="danger">Kill Applet</Button> */}
            <Button variant="secondary">Start Applet</Button>
            <Button variant="link" icon={<ArrowRightIcon />} iconPosition="end">
              Proceed to <strong>Application</strong>
            </Button>
          </Flex>
        </LoginPage>
      );
};
