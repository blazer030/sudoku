import Button from "@/presentation/components/ui/button/button";
import { useNavigate } from "react-router-dom";
import Icon from "@/presentation/components/icon/Icon";
import ICON_TYPE from "@/presentation/components/icon/IconType"

const Home = () => {
    const navigate = useNavigate();

    return <div className="flex flex-col h-full justify-center items-center gap-4 px-12">
        <div className="mb-32 rounded-full bg-sky-200 p-4 text-white">
            <Icon type={ICON_TYPE.Logo} size="10rem" />
        </div>

        <Button
            variant="outline"
            className="rounded-full w-full text-gray-500"
            onClick={() => {
                navigate("/game");
            }}
        >
            New Game
        </Button>

        <div className="w-full flex justify-between mt-12">
            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon type={ICON_TYPE.Settings} />
            </Button>

            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon type={ICON_TYPE.Cart} />
            </Button>

            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon type={ICON_TYPE.List} />
            </Button>

            <Button
                variant="ghost"
                className="rounded-full text-gray-500"
            >
                <Icon type={ICON_TYPE.Info} />
            </Button>
        </div>
    </div>;
};

export default Home;
