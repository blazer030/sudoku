import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Settings from "@/presentation/pages/settings/Settings.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import { getPalette } from "@/theme/palettes";
import { appVersion } from "@/utils/appVersion";

const createTestRouter = () => {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/settings", component: Settings },
            { path: "/", component: { template: "<div>Home</div>" } },
        ],
    });
};

const mountSettings = () => {
    const router = createTestRouter();
    const pinia = createPinia();
    const wrapper = mount(Settings, {
        global: { plugins: [router, pinia] },
    });
    const store = useSettingsStore();
    return { wrapper, store };
};

describe("Settings Page", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("should render 6 color theme swatches", () => {
        const { wrapper } = mountSettings();

        const swatches = wrapper.findAll("button[data-testid^='color-theme-']");
        expect(swatches).toHaveLength(6);
    });

    it("should mark current color theme as selected", () => {
        const { wrapper } = mountSettings();

        const greenSwatch = wrapper.find("[data-testid='color-theme-green']");
        expect(greenSwatch.find("[data-testid='color-theme-check']").exists()).toBe(true);
    });

    it("should draw the swatch check in the swatch's own on-primary colour", () => {
        const { wrapper } = mountSettings();
        const probe = document.createElement("div");
        probe.style.color = getPalette("minimal", "green", "light")["on-primary"];

        const check = wrapper.get<HTMLElement>("[data-testid='color-theme-check']").element;

        expect(check.style.color).toBe(probe.style.color);
    });

    it("should change color theme when clicking a swatch", async () => {
        const { wrapper, store } = mountSettings();

        await wrapper.find("[data-testid='color-theme-blue']").trigger("click");

        expect(store.colorTheme).toBe("blue");
    });

    it("should render 5 toggle tiles", () => {
        const { wrapper } = mountSettings();

        const toggles = wrapper.findAll("[data-testid^='toggle-']");
        expect(toggles).toHaveLength(5);
    });

    it("should toggle highlightSameDigit setting", async () => {
        const { wrapper, store } = mountSettings();

        await wrapper.find("[data-testid='toggle-highlightSameDigit']").trigger("click");

        expect(store.highlightSameDigit).toBe(false);
    });

    it("should toggle completionFlash setting", async () => {
        const { wrapper, store } = mountSettings();

        await wrapper.find("[data-testid='toggle-completionFlash']").trigger("click");

        expect(store.completionFlash).toBe(false);
    });

    it("should toggle autoRemoveNotes setting", async () => {
        const { wrapper, store } = mountSettings();

        await wrapper.find("[data-testid='toggle-autoRemoveNotes']").trigger("click");

        expect(store.autoRemoveNotes).toBe(false);
    });

    it("should toggle showRemainingCount setting", async () => {
        const { wrapper, store } = mountSettings();

        await wrapper.find("[data-testid='toggle-showRemainingCount']").trigger("click");

        expect(store.showRemainingCount).toBe(false);
    });

    it("should display app version", () => {
        const { wrapper } = mountSettings();

        expect(wrapper.get("[data-testid='version-link']").text()).toContain(appVersion);
    });
});
