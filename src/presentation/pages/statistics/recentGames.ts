import type { Difficulty } from "@/domain";
import type { GameResult } from "@/application/statistics/StatisticsRepository";

export type RecentGamesFilter = "all" | Difficulty;

export interface RecentGame {
    game: GameResult;
    /** The game's position in the stored history, which is what the review route takes. */
    historyIndex: number;
}

export const RECENT_GAMES_PAGE_SIZE = 20;

/** Lists the games newest first, each keeping its own index in the history, so a filtered list still opens the right review. */
export const listRecentGames = (history: readonly GameResult[], filter: RecentGamesFilter): RecentGame[] =>
    history
        .map((game, historyIndex) => ({ game, historyIndex }))
        .filter(({ game }) => filter === "all" || game.difficulty === filter)
        .reverse();
