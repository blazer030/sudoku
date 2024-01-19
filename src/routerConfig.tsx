import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/presentation/App";
import Home from "@/presentation/pages/home/Home";
import Game from "@/presentation/pages/game/Game";

const router = createBrowserRouter([{
    path: "/",
    element: <App />,
    children: [{
        path: "/",
        element: <Home />,
    }, {
        path: "/game",
        element: <Game />,
    }],
}, {
    path: "*",
    element: <Navigate to={"/"} />,
}]);

export default router;
