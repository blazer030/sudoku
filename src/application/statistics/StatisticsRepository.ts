import type { InjectionKey } from "vue";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { GameReplayData } from "@/domain/game/GameReplay";

export interface GameResult {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
    date: string;
    hintsUsed: number;
    replay?: GameReplayData;
}

export interface StatisticsRepository {
    load(): Promise<GameResult[]>;
    /** Adds one finished game after the games already stored; `load()` returns games oldest first. */
    append(game: GameResult): Promise<void>;
    clear(): Promise<void>;
}

export const STATISTICS_REPOSITORY_KEY: InjectionKey<StatisticsRepository> = Symbol("StatisticsRepository");
