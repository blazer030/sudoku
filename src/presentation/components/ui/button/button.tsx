import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/presentation/components/ui/lib/utils";
import buttonVariants from "@/presentation/components/ui/button/variants";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    ref?: React.Ref<HTMLButtonElement>;
}

const Button = ({
    className,
    variant,
    size,
    asChild = false,
    ref,
    ...props
}: ButtonProps) => {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(buttonVariants({
                variant,
                size,
                className
            }))}
            ref={ref}
            {...props}
        />
    );
};

export default Button;
