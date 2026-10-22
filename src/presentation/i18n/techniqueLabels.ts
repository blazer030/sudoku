import { useI18n } from "vue-i18n";
import type { TechniqueId } from "@/domain/solver/SolveStep";

export const useTechniqueLabel = (): ((technique: TechniqueId) => string) => {
    const { t } = useI18n();
    return (technique) => t(`technique.${technique}`);
};
