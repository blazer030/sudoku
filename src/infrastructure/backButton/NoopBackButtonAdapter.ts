import type { BackButtonService } from "@/application/backButton/BackButtonService";

export class NoopBackButtonAdapter implements BackButtonService {
    listen(_handler: (canGoBack: boolean) => void): void {
        // intentional no-op on web: the browser's Back goes through the router's history
    }
}
