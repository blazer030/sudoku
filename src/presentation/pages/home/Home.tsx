import Button from "@/presentation/components/ui/button/button.tsx";
import { useNavigate } from "react-router-dom";
import { MdFormatListBulleted, MdInfo, MdSettings, MdShoppingCart } from "react-icons/md";

export const Home = () => {
    const navigate = useNavigate();

    return <div className="flex flex-col h-full justify-center items-center gap-4 px-12">
        <Button variant="outline"
                className="rounded-full w-full"
                onClick={() => {
                    navigate("/game");
                }}
        >
            New Game
        </Button>

        <div className="w-full flex justify-between mt-12">
            <div>
                <Button variant="ghost" className="rounded-full">
                    <MdSettings size="1.5rem" />
                </Button>
            </div>
            <div>
                <MdShoppingCart size="1.5rem" />
            </div>
            <div>
                <MdFormatListBulleted size="1.5rem" />
            </div>
            <div>
                <MdInfo size="1.5rem" />
            </div>
        </div>
    </div>;
};
