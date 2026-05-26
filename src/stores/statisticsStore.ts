import { ref } from "vue";
import { defineStore } from "pinia";
import type { GameResult, StatisticsRepository } from "@/application/statistics/StatisticsRepository";

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

    return {
        history,
        setRepository,
        loadFromRepository,
    };
});
