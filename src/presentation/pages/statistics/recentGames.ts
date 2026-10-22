import type { GameResult } from "@/application/statistics/StatisticsRepository";

export interface RecentGame {
    game: GameResult;
    /** The game's position in the stored history, which is what the review route takes. */
    historyIndex: number;
}

/** Lists the games newest first, each keeping its own index in the history. */
export const listRecentGames = (history: readonly GameResult[]): RecentGame[] =>
    history
        .map((game, historyIndex) => ({ game, historyIndex }))
        .reverse();
