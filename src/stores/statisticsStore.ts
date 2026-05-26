import { ref } from "vue";
import { defineStore } from "pinia";
import type { Difficulty } from "@/domain";
import type {
    GameReplayData,
    GameResult,
    StatisticsRepository,
} from "@/application/statistics/StatisticsRepository";

export interface RecordGameInput {
    difficulty: Difficulty;
    elapsedSeconds: number;
    completed: boolean;
    hintsUsed?: number;
    replay?: GameReplayData;
}

export const useStatisticsStore = defineStore("statistics", () => {
    const history = ref<GameResult[]>([]);
    let repository: StatisticsRepository | null = null;

    const setRepository = (repo: StatisticsRepository) => {
        repository = repo;
    };

    const loadFromRepository = async () => {
        if (repository === null) return;
        history.value = await repository.load();
    };

    const persist = () => {
        if (repository === null) return;
        void repository.save(history.value);
    };

    const recordGame = (input: RecordGameInput) => {
        history.value.push({
            ...input,
            hintsUsed: input.hintsUsed ?? 0,
            date: new Date().toISOString(),
        });
        persist();
    };

    return {
        history,
        setRepository,
        loadFromRepository,
        recordGame,
    };
});
