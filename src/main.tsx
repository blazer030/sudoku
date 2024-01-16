import React from "react";
import ReactDOM from "react-dom/client";
import "@/style/index.scss";
import { RouterProvider } from "react-router-dom";
import router from "@/routerConfig.tsx";

const domNode = document.getElementById("root");
if (!domNode) {
    throw new Error("No root element found");
}

ReactDOM.createRoot(domNode)
    .render(
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>,
    );
