import Button from "@/presentation/components/ui/button/button";
import { useNavigate } from "react-router-dom";
import Icon from "@/presentation/components/icon/Icon"
import { ROUTER_PATH } from "@/routerConfig";

const Home = () => {
    const navigate = useNavigate();

    return <div className="flex flex-col h-full justify-center items-center gap-4 px-12">
        <div className="mb-32 rounded-full bg-sky-200 p-4 text-white">
            <Icon.Logo size="10rem" />
        </div>

        <Button
            variant="outline"
            className="rounded-full w-full text-gray-500"
            onClick={() => {
                navigate(ROUTER_PATH.game);
            }}
        >
            New Game
        </Button>

        <div className="w-full flex justify-between mt-12">
            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon.Settings size="1.5rem" />
            </Button>

            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon.Cart size="1.5rem" />
            </Button>

            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon.List size="1.5rem" />
            </Button>

            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon.Info size="1.5rem" />
            </Button>
        </div>
    </div>;
};

export default Home;
