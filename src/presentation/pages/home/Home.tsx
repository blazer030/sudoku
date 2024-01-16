import { Button } from "@/presentation/components/ui/button.tsx";

export const Home = () => {
    const buttonName: string = "hello";
    return <div>
        home
        <Button variant="outline" className="rounded-full">
            {buttonName}
        </Button>
    </div>;
};
