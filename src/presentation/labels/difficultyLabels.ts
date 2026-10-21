import { useI18n } from "vue-i18n";
import type { Difficulty } from "@/domain";

export const useDifficultyLabel = (): ((difficulty: Difficulty) => string) => {
    const { t } = useI18n();
    return (difficulty) => t(`difficulty.${difficulty}`);
};
