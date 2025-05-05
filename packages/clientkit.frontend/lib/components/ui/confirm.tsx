import React from "react";
import * as P from "@patternfly/react-core";

import { ActionButton } from "./action";


export interface ConfirmModalProps {
    title?: React.ReactNode;
    body?: React.ReactNode;
    confirmText?: React.ReactNode;
    cancelText?: React.ReactNode;

    isOpen?: boolean;
    onClose?: () => void;

    onConfirm?: () => Promise<void>;
    onCancel?: () => Promise<void>;
}

// TODO !!!!!
export const ConfirmModal = (props: ConfirmModalProps) => {
    const [isOpen, setIsOpen] = React.useState(props.isOpen ?? false);
    const onClose = () => {
        setIsOpen(false);
        props.onClose?.();
    };

    return (
        <P.Modal
            variant="small"
            isOpen={isOpen}
            onClose={onClose}
            aria-labelledby="scrollable-modal-title"
            aria-describedby="modal-box-body-scrollable"
        >
            <P.ModalHeader title={props.title} labelId="scrollable-modal-title" />
            <P.ModalBody tabIndex={0} id="modal-box-body-scrollable" aria-label="Scrollable modal content">
                {props.body}
            </P.ModalBody>
            <P.ModalFooter>
                <ActionButton key="confirm" variant="danger" onClick={props.onConfirm}>
                    {props.confirmText ?? "Confirm"}
                </ActionButton>
                <ActionButton key="cancel" variant="link" onClick={async () => {
                    onClose();
                    await props.onCancel?.();
                }}>
                    {props.cancelText ?? "Cancel"}
                </ActionButton>
            </P.ModalFooter>
        </P.Modal>
    );
};