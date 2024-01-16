import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/presentation/App.tsx";
import { Button } from "@/presentation/components/ui/button.tsx";

const Home = () => {
    const buttonName: string = "hello";
    return <div>
        home
        <Button variant="outline" className="rounded-full">
            {buttonName}
        </Button>
    </div>;
};

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
