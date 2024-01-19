import Button from "@/presentation/components/ui/button/button";
import { useNavigate } from "react-router-dom";
import Icon from "@/presentation/components/icon/Icon";
import ICON_TYPE from "@/presentation/components/icon/IconType"

export const Home = () => {
    const navigate = useNavigate();

    return <div className="flex flex-col h-full justify-center items-center gap-4 px-12">
        <div className="mb-32">
            <Icon type={ICON_TYPE.Logo} size="10rem" />
        </div>

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
                <Icon type={ICON_TYPE.Settings} />
            </div>
            <div>
                <Icon type={ICON_TYPE.Cart} />
            </div>
            <div>
                <Icon type={ICON_TYPE.List} />
            </div>
            <div>
                <Icon type={ICON_TYPE.Info} />
            </div>
        </div>
    </div>;
};
