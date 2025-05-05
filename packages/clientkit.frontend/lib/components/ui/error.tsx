import React from "react";

export const useErrorHandler = () => {
    const [_, setError] = React.useState();
    
    return React.useCallback(
        (e: Error | any) => {
            setError(() => {
                throw e;
            });
        },
        [setError],
    );
};