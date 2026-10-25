import type { InjectionKey } from "vue";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { GameStep } from "@/domain/game/GameStep";
import type { CellState } from "@/application/game/GameState";

export interface GameReplayData {
    initialBoard: CellState[][];
    steps: GameStep[];
}

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
