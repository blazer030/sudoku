import { App } from "@capacitor/app";
import type { BackButtonService } from "@/application/backButton/BackButtonService";

// Once the page listens, Capacitor no longer goes back on its own; the handler decides
export class CapacitorBackButtonAdapter implements BackButtonService {
    listen(handler: (canGoBack: boolean) => void): void {
        App.addListener("backButton", ({ canGoBack }) => {
            handler(canGoBack);
        }).catch((error: unknown) => {
            console.error("Failed to register the backButton listener", error);
        });
    }
}
