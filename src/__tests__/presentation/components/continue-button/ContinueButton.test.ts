import { afterEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ContinueButton from "@/presentation/components/continue-button/ContinueButton.vue";
import { useGameStore } from "@/stores/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CellState, GameState } from "@/application/game/GameState";
import { i18n } from "@/presentation/i18n";
import type { StyleId } from "@/theme/themeIds";

const CHIP_IDS = ["continue-difficulty", "continue-time", "continue-progress"] as const;

const savedGame: GameState = {
    difficulty: "medium",
    answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
    cells: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, (): CellState => ({ clue: 0, entry: 0, notes: [] }))
    ),
    elapsedSeconds: 522,
    completed: false,
    hintsUsed: 0,
};

const mountContinueButton = (style: StyleId = "minimal") => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useSettingsStore().setStyle(style);
    useGameStore().persistGame(savedGame);
    return mount(ContinueButton, { global: { plugins: [pinia] } });
};

afterEach(() => {
    localStorage.clear();
});

describe("ContinueButton", () => {
    it("should caption every chip, in the player's language", async () => {
        const wrapper = mountContinueButton();
        const captions = () => CHIP_IDS.map(id => wrapper.get(`[data-testid='${id}']`).attributes("data-caption"));

        const english = captions();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        const chinese = captions();

        for (const caption of [...english, ...chinese]) expect(caption).toBeTruthy();
        expect(new Set(english).size).toBe(3);
        for (const [index, caption] of chinese.entries()) expect(caption).not.toBe(english[index]);
    });

    it("should lay the card out as chips, as before, outside blueprint", () => {
        const wrapper = mountContinueButton("minimal");
        const button = wrapper.get("[data-testid='continue-button']");

        expect(button.attributes("data-layout")).toBe("chips");
        expect(button.classes()).toEqual(expect.arrayContaining(["flex", "flex-col", "items-start", "gap-2.5", "px-5", "py-4", "rounded-2xl"]));
        for (const id of CHIP_IDS) {
            expect(wrapper.get(`[data-testid='${id}']`).classes()).toEqual(["text-sm", "bg-on-featured/20", "rounded-full", "px-2.5", "py-0.5"]);
        }
    });

    it("should lay blueprint's card out as a title block of three equal columns", () => {
        const wrapper = mountContinueButton("blueprint");

        expect(wrapper.get("[data-testid='continue-button']").attributes("data-layout")).toBe("title-block");
        for (const id of CHIP_IDS) expect(wrapper.get(`[data-testid='${id}']`).classes()).toContain("flex-1");
    });
});
