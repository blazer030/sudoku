import type { InjectionKey } from "vue";
import type { Difficulty } from "@/domain";

export type DonateTier = "coffee" | "lunch" | "coding_time";
// Play Console SKU is always `donate_${tier}`.

export type AnalyticsEvent =
    | { name: "game_start"; difficulty: Difficulty }
    | { name: "game_complete"; difficulty: Difficulty; time_seconds: number; hints_used: number }
    | { name: "game_abandon"; difficulty: Difficulty; progress_pct: number }
    | { name: "hint_used"; hint_type: "auto_notes" | "check_conflicts" | "check_errors" | "reveal_cell" }
    | { name: "donate_view" }
    | { name: "donate_tap"; tier: DonateTier }
    | { name: "donate_success"; tier: DonateTier; amount_usd: number };

export interface AnalyticsService {
    logEvent(event: AnalyticsEvent): Promise<void>;
}

export const ANALYTICS_KEY: InjectionKey<AnalyticsService> = Symbol("AnalyticsService");
