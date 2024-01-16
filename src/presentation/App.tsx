import { Outlet } from "react-router-dom";
import { Button } from "@/presentation/components/ui/button.tsx";

function App() {
    return (
        <div className="container mx-auto">
            <Button>hello</Button>
            <Outlet />
        </div>
    );
}

export default App;
