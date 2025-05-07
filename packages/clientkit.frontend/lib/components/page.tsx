import React from "react";
import * as P from "@patternfly/react-core";
import { AppletSpawnerInfo } from "@hagateway/api/dist/lib/applet";
import { AppletIcon } from "./applet";


export interface PageProps {
    appletSpawnerInfo?: AppletSpawnerInfo;
    children?: React.ReactNode;
}

export const Page
: React.FunctionComponent<PageProps> = (props) => {
    return <P.Login 
        header={
            <P.LoginHeader 
                headerBrand={
                    <AppletIcon 
                        appletSpawnerInfo={props.appletSpawnerInfo} 
                        size="2xl"
                    />
                }
            />
        }
        children={props.children}
    />;
};

export const PageMainHeader = P.LoginMainHeader;

export const PageMainBody = P.LoginMainBody;