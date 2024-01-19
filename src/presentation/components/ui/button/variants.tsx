import { cva } from "class-variance-authority";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-sky-950 dark:focus-visible:ring-sky-300",
    {
        variants: {
            variant: {
                default: "bg-sky-900 text-sky-50 hover:bg-sky-900/90 dark:bg-sky-50 dark:text-sky-900 dark:hover:bg-sky-50/90",
                destructive:
                    "bg-red-500 text-sky-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-sky-50 dark:hover:bg-red-900/90",
                outline:
                    "border border-sky-200 bg-white hover:bg-sky-100 hover:text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:hover:bg-sky-800 dark:hover:text-sky-50",
                secondary:
                    "bg-sky-100 text-sky-900 hover:bg-sky-100/80 dark:bg-sky-800 dark:text-sky-50 dark:hover:bg-sky-800/80",
                ghost: "hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-sky-800 dark:hover:text-sky-50",
                link: "text-sky-900 underline-offset-4 hover:underline dark:text-sky-50",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)
export default buttonVariants;
