import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/presentation/App";
import Home from "@/presentation/pages/home/Home";
import Game from "@/presentation/pages/game/Game";

const baseUrl: string = import.meta.env.VITE_BASE_URL as string

export const ROUTER_PATH = {
    home: baseUrl,
    game: `${baseUrl}game`,
};

export const router = createBrowserRouter([{
    path: baseUrl,
    element: <App />,
    children: [{
        path: ROUTER_PATH.home,
        element: <Home />,
    }, {
        path: ROUTER_PATH.game,
        element: <Game />,
    }],
}, {
    path: "*",
    element: <Navigate to={baseUrl} />,
}]);
