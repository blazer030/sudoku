import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "Application/App.tsx";

export const router = createBrowserRouter([{
    path: "/",
    element: <App />,
    children: [{
        path: "/",
        element: <div>home</div>
    }, {
        path: "/game",
        element: <div>game</div>
    }]
}, {
    path: "*",
    element: <Navigate to={"/"} />
}]);