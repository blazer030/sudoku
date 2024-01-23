import {
    MdEdit,
    MdFormatListBulleted,
    MdInfo,
    MdOutlineAppRegistration,
    MdSettings,
    MdShoppingCart,
    MdUndo
} from "react-icons/md";
import { ComponentType, FunctionComponent } from "react";
import { IconBaseProps } from "react-icons";

interface IconProps {
    size?: string;
    src?: string;
}

const withProps = <T extends object>(iconProps: IconProps) => {
    return (Component: ComponentType<T>): FunctionComponent<T> => {
        const EnhancedComponent = (props: T) => {
            return <Component {...iconProps} {...props} />
        };
        EnhancedComponent.displayName = `withProps(${Component.displayName})`;

        return EnhancedComponent;
    }
}

const Icon = {
    Logo: withProps<IconBaseProps>({ size: "10rem" })(MdOutlineAppRegistration),
    Settings: withProps<IconBaseProps>({ size: "1.5rem" })(MdSettings),
    Cart: withProps<IconBaseProps>({ size: "1.5rem" })(MdShoppingCart),
    List: withProps<IconBaseProps>({ size: "1.5rem" })(MdFormatListBulleted),
    Info: withProps<IconBaseProps>({ size: "1.5rem" })(MdInfo),
    Note: withProps<IconBaseProps>({ size: "1.5rem" })(MdEdit),
    Undo: withProps<IconBaseProps>({ size: "1.5rem" })(MdUndo),
}

export default Icon;
