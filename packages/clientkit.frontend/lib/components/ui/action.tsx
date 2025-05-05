import React from "react";
import * as P from "@patternfly/react-core";

import { useErrorHandler } from "./error";


export interface ActionButtonProps {
    variant?: "primary" | "secondary" | "tertiary" | "danger" | "warning" | "link";
    icon?: React.ReactNode;
    iconPosition?: "end" | "start" | "left" | "right";
    isDisabled?: boolean;
    isLoading?: boolean;
    onClick?: () => Promise<void>;
    children?: React.ReactNode;
}

export const ActionButton = (props: ActionButtonProps) => {
    const errorHandler = useErrorHandler();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = async () => {
        if (props.onClick) {
            setIsLoading(true);
            try {
                await props.onClick();
            } catch (error) {
                errorHandler(error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <P.Button
            variant={props.variant}
            icon={props.icon}
            iconPosition={props.iconPosition}
            isDisabled={props.isDisabled}
            isLoading={isLoading || props.isLoading}
            onClick={handleClick}
        >
            {props.children}
        </P.Button>
    );
};