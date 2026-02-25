import { Outlet } from "react-router";

function App() {
    return (
        <div className="max-w-screen-sm h-dvh mx-auto">
            <Outlet />
        </div>
    );
}

export default App;
