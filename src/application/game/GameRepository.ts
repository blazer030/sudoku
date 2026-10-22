import type { InjectionKey } from "vue";
import type { GameState } from "@/application/game/GameState";

export interface GameRepository {
    load(): Promise<GameState | null>;
    save(state: GameState): Promise<void>;
    clear(): Promise<void>;
}

export const GAME_REPOSITORY_KEY: InjectionKey<GameRepository> = Symbol("GameRepository");
