import { createAnalyticsSpy } from "@/__tests__/fixtures/analyticsSpy";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import type { CellState, GameState } from "@/application/game/GameState";
import { i18n } from "@/presentation/i18n";
import { knownAnswer, knownPuzzle } from "@/__tests__/fixtures/knownPuzzle";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { handleBackButton } from "@/presentation/composables/backDismissal";
import { useSettingsStore } from "@/stores/settingsStore";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";
import { STYLE_HOME_HEROES } from "@/presentation/pages/home/homeHeroes";

vi.mock("@/application/puzzleGeneration/PuzzleGenerationService", () => ({
    generatePuzzleAsync: vi.fn(() => Promise.resolve({
        puzzle: knownPuzzle.map(row => [...row]),
        answer: knownAnswer.map(row => [...row]),
    })),
}));

vi.mock("@/presentation/components/puzzle-loader/usePuzzleLoader", async () => {
    const { ref } = await import("vue");
    return {
        usePuzzleLoader: () => ({
            visible: ref(false),
            runWithLoader: <T,>(task: () => Promise<T>) => task(),
        }),
    };
});

const createTestRouter = () => {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: Home },
            { path: "/game", component: { template: "<div>Game</div>" } },
            { path: "/solver", component: { template: "<div>Solver</div>" } },
            { path: "/statistics", component: { template: "<div>Statistics</div>" } },
            { path: "/settings", component: { template: "<div>Settings</div>" } },
        ],
    });
};

const mountHome = ({ savedGame, analytics, style }: { savedGame?: GameState; analytics?: AnalyticsService; style?: StyleId } = {}) => {
    const router = createTestRouter();
    const pinia = createPinia();
    setActivePinia(pinia);
    if (style !== undefined) {
        useSettingsStore().setStyle(style);
    }
    if (savedGame !== undefined) {
        useGameStore().persistGame(savedGame);
    }
    const wrapper = mount(Home, {
        global: {
            plugins: [router, pinia],
            provide: analytics === undefined ? {} : { [ANALYTICS_KEY as symbol]: analytics },
        },
    });
    return { wrapper, router, pinia };
};

const dummySave: GameState = {
    difficulty: "easy",
    answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
    cells: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, (): CellState => ({ clue: 0, entry: 0, notes: [] }))
    ),
    elapsedSeconds: 204,
    completed: false,
    hintsUsed: 0,
};

afterEach(() => {
    localStorage.clear();
});

describe("Home", () => {
    it("should show Traditional Chinese labels when the language is zh-Hant", async () => {
        const { wrapper } = mountHome({ savedGame: dummySave });

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        const text = wrapper.text();
        for (const label of ["數獨", "新遊戲", "繼續遊戲", "統計", "解題演示", "設定"]) {
            expect(text).toContain(label);
        }
        expect(text).not.toContain("Train your brain");
    });

    it("should set a Chinese title as one plate per character, reading as before", async () => {
        const { wrapper } = mountHome();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        const glyphs = wrapper.findAll("[data-testid='home-title-glyph']");
        expect(glyphs.map(glyph => glyph.text())).toEqual(["數", "獨"]);
        expect(wrapper.get("h1").text()).toBe("數獨");
        for (const glyph of glyphs) expect(glyph.attributes("data-skin")).toBe("title-glyph");
    });

    it("should mark the logo box for styles to decorate", () => {
        const { wrapper } = mountHome();

        expect(wrapper.get("[data-testid='home-logo']").attributes("data-skin")).toBe("logo");
    });

    it("should give every stacked style the same hero", () => {
        const stackedHeroes = STYLE_IDS.filter(style => STYLE_HOME_HEROES[style] === "stacked")
            .map(style => mountHome({ style }).wrapper.get("[data-testid='home-hero']").html());

        expect(stackedHeroes.length).toBeGreaterThan(0);
        expect(new Set(stackedHeroes).size).toBe(1);
        expect(stackedHeroes[0]).toContain('data-skin="logo"');
    });

    it("should keep an English title whole", () => {
        const { wrapper } = mountHome();

        expect(wrapper.findAll("[data-testid='home-title-glyph']").map(glyph => glyph.text())).toEqual(["Sudoku"]);
        expect(wrapper.get("h1").text()).toBe("Sudoku");
    });

    it("should let the new game button colour its icon and label", () => {
        for (const savedGame of [undefined, dummySave]) {
            const { wrapper } = mountHome({ savedGame });
            const button = wrapper.get("[data-testid='new-game-button']");
            const colourClasses = [button.get("svg"), button.get("span")]
                .flatMap(element => element.classes())
                .filter(name => /^text-(?!(?:xs|sm|base|lg|[2-9]?xl)$)/.test(name));

            expect(colourClasses).toEqual([]);
        }
    });

    it("should show Easy as default selected difficulty", () => {
        const { wrapper } = mountHome();
        const easyBtn = wrapper.find("[data-testid='difficulty-easy']");

        expect(easyBtn.attributes("aria-pressed")).toBe("true");
    });

    it("should select difficulty when clicking pill", async () => {
        const { wrapper } = mountHome();

        await wrapper.find("[data-testid='difficulty-medium']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-medium']").attributes("aria-pressed")).toBe("true");
        expect(wrapper.find("[data-testid='difficulty-easy']").attributes("aria-pressed")).toBe("false");

        await wrapper.find("[data-testid='difficulty-hard']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-hard']").attributes("aria-pressed")).toBe("true");
        expect(wrapper.find("[data-testid='difficulty-medium']").attributes("aria-pressed")).toBe("false");
    });

    it("should paint Continue with its own featured surface", () => {
        const { wrapper } = mountHome({ savedGame: dummySave });
        const classes = wrapper.get("[data-testid='continue-button']").classes();

        expect(classes).toContain("bg-featured");
        expect(classes).toContain("text-on-featured");
        expect(classes).not.toContain("bg-primary");
    });

    it("should show the saved difficulty, time and progress", () => {
        const { wrapper } = mountHome({ savedGame: dummySave });
        const chip = (id: string) => wrapper.get(`[data-testid='${id}']`).text();

        expect(chip("continue-difficulty")).toBe("Easy");
        expect(chip("continue-time")).toBe("03:24");
        expect(chip("continue-progress")).toBe("0% filled");
    });

    it("should count only the player's cells in the progress", () => {
        let entriesLeft = 17;
        const cells = knownPuzzle.map((row, rowIndex) => row.map((clue, columnIndex): CellState => {
            if (clue !== 0) return { clue, entry: 0, notes: [] };
            if (entriesLeft === 0) return { clue: 0, entry: 0, notes: [] };
            entriesLeft -= 1;
            return { clue: 0, entry: knownAnswer[rowIndex][columnIndex], notes: [] };
        }));
        expect(knownPuzzle.flat().filter(clue => clue !== 0)).toHaveLength(30);
        const { wrapper } = mountHome({ savedGame: { ...dummySave, cells, answer: knownAnswer.map(row => [...row]) } });

        expect(wrapper.get("[data-testid='continue-progress']").text()).toBe("33% filled");
    });

    it("should put the difficulty picker inside the new game card, right above its button", () => {
        const { wrapper } = mountHome();
        const card = wrapper.get("[data-testid='new-game-card']");

        expect(card.find("[data-testid='difficulty-switcher']").exists()).toBe(true);
        expect(wrapper.get("[data-testid='difficulty-switcher']").element.nextElementSibling)
            .toBe(wrapper.get("[data-testid='new-game-button']").element);
    });

    it("should keep continue apart from the new game card", () => {
        const { wrapper } = mountHome({ savedGame: dummySave });
        const card = wrapper.get("[data-testid='new-game-card']");
        const continueButton = wrapper.get("[data-testid='continue-button']");

        expect(card.find("[data-testid='continue-button']").exists()).toBe(false);
        expect(continueButton.element.compareDocumentPosition(card.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("should show only the new game card without a save", () => {
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='continue-button']").exists()).toBe(false);
        expect(wrapper.get("[data-testid='new-game-button']").classes()).toContain("bg-primary");
    });

    it("should make new game secondary while a save exists", () => {
        const { wrapper } = mountHome({ savedGame: dummySave });
        const classes = wrapper.get("[data-testid='new-game-button']").classes();

        expect(classes).toContain("bg-primary-light");
        expect(classes).not.toContain("bg-primary");
    });

    it("should show the entries in order", () => {
        const { wrapper } = mountHome();

        expect(wrapper.get("[data-testid='home-entries']").findAll("button").map(button => button.attributes("data-testid")))
            .toEqual(["statistics-button", "walkthrough-button", "settings-button"]);
    });

    it("should say no games yet instead of a 0% win rate", () => {
        const { wrapper } = mountHome();

        expect(wrapper.get("[data-testid='statistics-subtitle']").text()).toBe("No games yet");
    });

    it("should show the win rate on the statistics tile", async () => {
        const { wrapper } = mountHome();
        const statisticsStore = useStatisticsStore();
        statisticsStore.recordGame({ difficulty: "easy", elapsedSeconds: 100, completed: true });
        statisticsStore.recordGame({ difficulty: "easy", elapsedSeconds: 100, completed: true });
        statisticsStore.recordGame({ difficulty: "easy", elapsedSeconds: 100, completed: false });
        await nextTick();

        expect(wrapper.get("[data-testid='statistics-subtitle']").text()).toBe("Win rate 67%");
    });

    it("should describe the walkthrough and settings tiles", () => {
        const { wrapper } = mountHome();
        const subtitle = (id: string) => wrapper.get(`[data-testid='${id}-subtitle']`).text();

        expect(subtitle("walkthrough")).toBe("Enter a puzzle, see the steps");
        expect(subtitle("settings")).toBe("Theme, mode, language");
    });

    it("should make the whole tile the tap target", () => {
        const { wrapper } = mountHome();

        for (const id of ["statistics", "walkthrough", "settings"]) {
            const button = wrapper.get(`[data-testid='${id}-button']`);
            expect(button.element.tagName).toBe("BUTTON");
            expect(button.find("svg").exists()).toBe(true);
            expect(button.find(`[data-testid='${id}-label']`).exists()).toBe(true);
            expect(button.find(`[data-testid='${id}-subtitle']`).exists()).toBe(true);
            expect(button.classes()).toContain("min-h-22");
        }
    });

    it("should open statistics and settings from their tiles", async () => {
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.get("[data-testid='statistics-button']").trigger("click");
        await flushPromises();
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.statistics);

        await wrapper.get("[data-testid='settings-button']").trigger("click");
        await flushPromises();
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.settings);
    });

    it("should navigate to game page when clicking Continue", async () => {
        const { wrapper, router } = mountHome({ savedGame: dummySave });
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='continue-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should set difficulty in store when starting game", async () => {
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='difficulty-medium']").trigger("click");
        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.difficulty).toBe("medium");
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should load saved game into store before navigating on Continue click", async () => {
        const { wrapper, router, pinia } = mountHome({ savedGame: dummySave });
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='continue-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.hasActiveGame).toBe(true);
        expect(gameStore.elapsedSeconds).toBe(204);
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should navigate to solver walkthrough when clicking Walkthrough button", async () => {
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='walkthrough-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.solverWalkthrough);
    });

    it("should create game in store before navigating on New Game click", async () => {
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        // Without a save there is nothing to give up, so no confirmation
        expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(false);
        const gameStore = useGameStore(pinia);
        expect(gameStore.hasActiveGame).toBe(true);
        expect(gameStore.sudoku).not.toBeNull();
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    describe("New Game Confirm Dialog", () => {
        it("should show confirm dialog when clicking New Game with saved game", async () => {
            const { wrapper } = mountHome({ savedGame: dummySave });

            await wrapper.find("[data-testid='new-game-button']").trigger("click");

            expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='new-game-confirm-dialog']").text()).toContain("Unfinished Game");
        });

        it("should show which game would be given up and what that costs", async () => {
            const { wrapper } = mountHome({ savedGame: dummySave });

            await wrapper.find("[data-testid='new-game-button']").trigger("click");

            expect(wrapper.find("[data-testid='new-game-saved-summary']").text()).toBe("Easy · 03:24 played");
            expect(wrapper.find("[data-testid='new-game-give-up-note']").text()).toBe("Giving up counts as an unfinished game and lowers your win rate.");
        });

        it("should make continuing the primary choice and giving up a quiet text button", async () => {
            const { wrapper } = mountHome({ savedGame: dummySave });

            await wrapper.find("[data-testid='new-game-button']").trigger("click");

            const continueButton = wrapper.find("[data-testid='new-game-continue-button']");
            expect(continueButton.text()).toBe("Continue That Game");
            expect(continueButton.classes()).toContain("bg-primary");
            const giveUp = wrapper.find("[data-testid='give-up-and-start-new-button']");
            expect(giveUp.classes()).toContain("text-danger");
            expect(giveUp.classes()).not.toContain("bg-danger");
        });

        describe("staying on Home", () => {
            const openDialog = async () => {
                const analytics = createAnalyticsSpy();
                const { wrapper, router, pinia } = mountHome({ savedGame: dummySave, analytics });
                await router.push("/");
                await router.isReady();
                await wrapper.find("[data-testid='new-game-button']").trigger("click");
                return { wrapper, router, pinia, analytics };
            };

            const expectStayedWithoutSideEffects = async ({ wrapper, router, pinia, analytics }: Awaited<ReturnType<typeof openDialog>>) => {
                await flushPromises();
                expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(false);
                expect(router.currentRoute.value.path).toBe("/");
                const gameStore = useGameStore(pinia);
                expect(gameStore.savedGame).not.toBeNull();
                expect(gameStore.hasActiveGame).toBe(false);
                expect(useStatisticsStore(pinia).history).toHaveLength(0);
                expect(analytics.logEvent).not.toHaveBeenCalled();
            };

            it("should offer a quiet Stay here action below the give up action", async () => {
                const { wrapper } = await openDialog();

                const stay = wrapper.find("[data-testid='new-game-stay-button']");
                expect(stay.text()).toBe("Stay here");
                expect(stay.classes()).not.toContain("bg-primary");
                expect(stay.classes()).not.toContain("text-danger");
            });

            it.each([
                ["tapping Stay here", (wrapper: VueWrapper) => wrapper.find("[data-testid='new-game-stay-button']").trigger("click")],
                ["tapping the scrim", (wrapper: VueWrapper) => wrapper.find("[data-testid='new-game-confirm-dialog']").trigger("click")],
                ["pressing Escape", () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))],
                ["pressing the system Back key", () => { handleBackButton(false); }],
            ] as const)("should close the dialog without side effects when %s", async (_way, dismiss) => {
                const context = await openDialog();

                await dismiss(context.wrapper);

                await expectStayedWithoutSideEffects(context);
            });

            it("should keep the dialog open when tapping inside the card", async () => {
                const { wrapper } = await openDialog();

                await wrapper.find("[data-testid='new-game-saved-summary']").trigger("click");

                expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(true);
            });
        });

        it("should record gave up and start new game when clicking Give Up & Start New", async () => {
            const { wrapper, router, pinia } = mountHome({ savedGame: dummySave });
            await router.push("/");
            await router.isReady();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-start-new-button']").trigger("click");
            await flushPromises();

            const gameStore = useGameStore(pinia);
            expect(gameStore.hasActiveGame).toBe(true);
            const history = useStatisticsStore(pinia).history;
            expect(history).toHaveLength(1);
            expect(history[0].completed).toBe(false);
            expect(history[0].difficulty).toBe("easy");
            expect(useGameStore(pinia).savedGame).toBeNull();
            expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
        });

        it("should no longer render the Continue card once the unfinished game is given up", async () => {
            const { wrapper, router } = mountHome({ savedGame: dummySave });
            await router.push("/");
            await router.isReady();
            expect(wrapper.find("[data-testid='continue-button']").exists()).toBe(true);

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-start-new-button']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='continue-button']").exists()).toBe(false);
        });

        const giveUpAndStartNew = async (savedGame: GameState) => {
            const { wrapper, router, pinia } = mountHome({ savedGame });
            await router.push("/");
            await router.isReady();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-start-new-button']").trigger("click");
            await flushPromises();

            return useStatisticsStore(pinia).history;
        };

        it("should keep the saved replay of the game given up by starting a new one", async () => {
            const replay = {
                initialBoard: dummySave.cells,
                steps: [{
                    board: dummySave.cells.map(row => row.map(() => ({ entry: 0, notes: [1, 2] }))),
                    action: "autoNotes" as const,
                    row: 0,
                    column: 0,
                    value: 0,
                }],
            };

            const history = await giveUpAndStartNew({ ...dummySave, replay });

            expect(history).toHaveLength(1);
            expect(history[0].replay).toEqual(replay);
        });

        // The save counts every hint used; statistics count the ones past the free first, as leaving a game does
        it("should record the hints a given-up game paid for", async () => {
            const history = await giveUpAndStartNew({ ...dummySave, hintsUsed: 3 });

            expect(history[0].hintsUsed).toBe(2);
        });

        it.each([
            [1, 0],
            [2, 1],
            [4, 3],
        ])("should record %i saved hints as %i paid ones when the game is given up", async (saved, recorded) => {
            const history = await giveUpAndStartNew({ ...dummySave, hintsUsed: saved });

            expect(history[0].hintsUsed).toBe(recorded);
        });

        it("should record a given-up game without a replay when its save has none", async () => {
            const history = await giveUpAndStartNew(dummySave);

            expect(history).toHaveLength(1);
            expect(history[0].replay).toBeUndefined();
        });

        it("should continue the saved game from the dialog", async () => {
            const analytics = createAnalyticsSpy();
            const { wrapper, router, pinia } = mountHome({ savedGame: dummySave, analytics });
            await router.push("/");
            await router.isReady();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await wrapper.find("[data-testid='new-game-continue-button']").trigger("click");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
            const gameStore = useGameStore(pinia);
            expect(gameStore.hasActiveGame).toBe(true);
            expect(gameStore.elapsedSeconds).toBe(204);
            expect(useStatisticsStore(pinia).history).toHaveLength(0);
            expect(analytics.logEvent).not.toHaveBeenCalledWith(expect.objectContaining({ name: "game_abandon" }));
        });
    });

    describe("game_abandon analytics", () => {
        const createAnalytics = () => (createAnalyticsSpy());

        const savedGameWithEntries: GameState = {
            ...dummySave,
            difficulty: "hard",
            answer: knownAnswer.map(row => [...row]),
            cells: knownAnswer.map((row, rowIndex) => row.map((value, columnIndex): CellState => {
                if (rowIndex === 0 && columnIndex < 2) return { clue: 0, entry: value, notes: [] };
                if (rowIndex === 0 && columnIndex < 4) return { clue: 0, entry: value % 9 + 1, notes: [] };
                return { clue: 0, entry: 0, notes: [] };
            })),
        };

        it("should log game_abandon with difficulty and progress when giving up the saved game", async () => {
            const analytics = createAnalytics();
            const { wrapper, router } = mountHome({ savedGame: savedGameWithEntries, analytics });
            await router.push("/");
            await router.isReady();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-start-new-button']").trigger("click");
            await flushPromises();

            expect(analytics.logEvent).toHaveBeenCalledWith({
                name: "game_abandon",
                difficulty: "hard",
                progress_pct: 5,
                correct_pct: 2,
                incorrect_pct: 2,
            });
        });

        it("should not log game_abandon when starting a new game without a saved game", async () => {
            const analytics = createAnalytics();
            const { wrapper, router } = mountHome({ analytics });
            await router.push("/");
            await router.isReady();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await flushPromises();

            expect(analytics.logEvent).not.toHaveBeenCalledWith(expect.objectContaining({ name: "game_abandon" }));
        });
    });

    it("should show press feedback on the new game button", async () => {
        const { wrapper } = mountHome();
        const button = wrapper.find("[data-testid='new-game-button']");

        await button.trigger("pointerdown");

        expect(button.attributes()).toHaveProperty("data-pressed");
        window.dispatchEvent(new Event("pointerup"));
    });
});
