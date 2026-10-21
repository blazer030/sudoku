import type { InjectionKey } from "vue";
import type { Difficulty } from "@/domain";
import type { GameStep } from "@/domain/game/GameStep";
import type { CellState } from "@/application/GameState";

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
    save(history: GameResult[]): Promise<void>;
    clear(): Promise<void>;
}

export const STATISTICS_REPOSITORY_KEY: InjectionKey<StatisticsRepository> = Symbol("StatisticsRepository");
