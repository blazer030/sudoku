import React from "react";
import * as Icons from "react-icons/md";
import ICON_TYPE from "@/presentation/components/icon/IconType.ts";

interface IconProps {
    type: ICON_TYPE;
    size?: string;
}

const Icon: React.FC<IconProps> = ({ type, size = "1.5rem" }) => {
    const IconComponent = Icons[type];
    return <IconComponent size={size} />
};

export default Icon;
