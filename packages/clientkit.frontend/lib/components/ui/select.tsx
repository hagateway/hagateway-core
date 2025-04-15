import React from "react";
import * as P from "@patternfly/react-core";


export interface SelectProps {
  label?: React.ReactNode;
  autoClose?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  selection?: any;
  onSelect?: (selection: any) => void;
  children?: React.ReactNode;
}

export const Select = React.forwardRef((props: SelectProps, ref) => {
  const [isOpen, setIsOpen] = React.useState(props.isOpen ?? false);
  React.useEffect(() => { props.onOpenChange?.(isOpen); }, [isOpen]);

  return (
    <P.Select
      ref={ref}
      toggle={(toggleRef: React.Ref<P.MenuToggleElement>) => (
        <P.MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          children={props.label}
        />
      )}
      isOpen={isOpen}
      onOpenChange={(isOpen) => setIsOpen(isOpen)}
      selected={props.selection}
      onSelect={(_event, selection) => {
        if (props.autoClose)
          setIsOpen(false);
        // TODO
        props.onSelect?.(selection);
      }}
      children={props.children}
    />
  );
});

export { SelectList, SelectOption } from "@patternfly/react-core";
