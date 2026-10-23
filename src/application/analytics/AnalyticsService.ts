import type { InjectionKey } from "vue";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";

export type DonateTier = "coffee" | "lunch" | "coding_time";
// Play Console SKU is always `donate_${tier}`.

export type AnalyticsEvent =
    | { name: "game_start"; difficulty: Difficulty }
    | { name: "game_complete"; difficulty: Difficulty; time_seconds: number; hints_used: number; hints_total: number }
    | { name: "game_abandon"; difficulty: Difficulty; progress_pct: number; correct_pct: number; incorrect_pct: number }
    | { name: "hint_used"; hint_type: "auto_notes" | "check_conflicts" | "reveal_cell" }
    | { name: "donate_view" }
    | { name: "donate_tap"; tier: DonateTier }
    | { name: "donate_success"; tier: DonateTier; amount_usd: number };

export type ScreenName =
    | "home"
    | "game"
    | "statistics"
    | "settings"
    | "appearance"
    | "changelog"
    | "donate"
    | "game_review"
    | "solver";

export type UserPropertyName = "style" | "color_theme" | "color_mode" | "language" | "icon_follows_theme";

export interface AnalyticsService {
    logEvent(event: AnalyticsEvent): Promise<void>;
    setScreen(screen: ScreenName): Promise<void>;
    setUserProperty(name: UserPropertyName, value: string): Promise<void>;
}

export const ANALYTICS_KEY: InjectionKey<AnalyticsService> = Symbol("AnalyticsService");
