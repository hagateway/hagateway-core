import React from "react";
import * as P from "@patternfly/react-core";
import { AppletSpawnerInfo } from "@hagateway/api/dist/lib/applet";


export interface AppletIconProps {
    appletSpawnerInfo?: AppletSpawnerInfo;
    size?: P.IconSize;
}

export const AppletIcon
: React.FunctionComponent<AppletIconProps> = (props) => {
    return <P.Icon size={props.size}>
        <img
            src={props.appletSpawnerInfo?.displayIcon} 
            alt={props.appletSpawnerInfo?.description ?? "Applet logo"}
        />
    </P.Icon>;
};