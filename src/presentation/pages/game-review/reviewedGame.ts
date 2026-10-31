import type { GameReplayData, GameResult } from "@/application/statistics/StatisticsRepository";

export type ReviewedGame = GameResult & { replay: GameReplayData };

const HISTORY_INDEX = /^\d+$/;

const hasReplay = (game: GameResult): game is ReviewedGame => game.replay !== undefined;

/**
 * The finished game a Game Review URL names, or null when its index names no game with a replay:
 * out of range, negative, not a whole number, or a record kept without its moves.
 */
export const findReviewedGame = (history: readonly GameResult[], index: string): ReviewedGame | null => {
    if (!HISTORY_INDEX.test(index)) return null;
    const position = Number(index);
    if (position >= history.length) return null;
    const game = history[position];
    return hasReplay(game) ? game : null;
};
