import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/presentation/App";
import { Home } from "@/presentation/pages/home/Home";

const router = createBrowserRouter([{
    path: "/",
    element: <App />,
    children: [{
        path: "/",
        element: <Home />,
    }, {
        path: "/game",
        element: <div>game</div>,
    }],
}, {
    path: "*",
    element: <Navigate to={"/"} />,
}]);

export default router;
