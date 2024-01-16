import { Button } from "@/presentation/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Home = () => {
    const navigate = useNavigate();

    return <div>
        home
        <Button variant="outline"
                className="rounded-full"
                onClick={() => {
                    navigate("/game");
                }}
        >
            Start
        </Button>
    </div>;
};
