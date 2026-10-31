import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Changelog from "@/presentation/pages/settings/Changelog.vue";
import { i18n } from "@/presentation/i18n";
import { CHANGELOG, UNRELEASED_CHANGES } from "@/presentation/pages/settings/changelogData";
import { APP_LOCALES } from "@/application/settings/SettingsStorage";

const mountChangelog = () => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div>Home</div>" } },
            { path: "/settings/changelog", component: Changelog },
        ],
    });
    return mount(Changelog, { global: { plugins: [router] } });
};

// Every change the players will read: each release, and the changes waiting for the next one
const ALL_CHANGE_LISTS = [...CHANGELOG.map(entry => entry.changes), UNRELEASED_CHANGES];

// The waiting list is empty right after a release, so the rendering tests use their own lines
const WAITING_LINES = [
    { text: { en: "A waiting change", "zh-Hant": "一項等待中的改動" } },
    { text: { en: "Another waiting change", "zh-Hant": "另一項等待中的改動" }, appOnly: true },
];
const releasedWaitingChanges = [...UNRELEASED_CHANGES];
const showWaiting = (changes: typeof UNRELEASED_CHANGES) => {
    UNRELEASED_CHANGES.splice(0, UNRELEASED_CHANGES.length, ...changes);
};

describe("Changelog", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        showWaiting(releasedWaitingChanges);
        i18n.global.locale.value = "en";
    });

    // Changes merged since the last release show on top in develop builds only, so a late release still
    // knows what it holds; players never see them
    it("should show the changes waiting for the next release on top in a develop build", () => {
        vi.stubEnv("VITE_APP_ENV", "develop");
        showWaiting(WAITING_LINES);
        const wrapper = mountChangelog();

        const entries = wrapper.findAll("[data-testid^='changelog-entry-']");
        expect(entries[0].attributes("data-testid")).toBe("changelog-entry-unreleased");
        for (const change of WAITING_LINES) {
            expect(entries[0].text()).toContain(change.text.en);
        }
    });

    it("should hide the changes waiting for the next release in a production build", () => {
        vi.stubEnv("VITE_APP_ENV", "production");
        showWaiting(WAITING_LINES);
        const wrapper = mountChangelog();

        expect(wrapper.find("[data-testid='changelog-entry-unreleased']").exists()).toBe(false);
    });

    it("should leave the waiting block out when nothing is waiting", () => {
        vi.stubEnv("VITE_APP_ENV", "develop");
        showWaiting([]);
        const wrapper = mountChangelog();

        expect(wrapper.find("[data-testid='changelog-entry-unreleased']").exists()).toBe(false);
    });

    it("should name the waiting changes differently in each language", async () => {
        vi.stubEnv("VITE_APP_ENV", "develop");
        showWaiting(WAITING_LINES);
        const wrapper = mountChangelog();
        const english = wrapper.find("[data-testid='changelog-entry-unreleased']").text();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.find("[data-testid='changelog-entry-unreleased']").text()).not.toBe(english);
    });

    it("should render an entry for every version", () => {
        const wrapper = mountChangelog();

        for (const entry of CHANGELOG) {
            expect(
                wrapper.find(`[data-testid='changelog-entry-${entry.version}']`).exists(),
            ).toBe(true);
        }
    });

    it("should render the release date and every change for the latest entry", () => {
        const wrapper = mountChangelog();
        const [latest] = CHANGELOG;

        const entry = wrapper.find(`[data-testid='changelog-entry-${latest.version}']`);

        expect(entry.text()).toContain(latest.date);
        for (const change of latest.changes.map(change => change.text.en)) {
            expect(entry.text()).toContain(change);
        }
    });

    it("should show only English changes in English", () => {
        const wrapper = mountChangelog();

        for (const entry of CHANGELOG) {
            const text = wrapper.find(`[data-testid='changelog-entry-${entry.version}']`).text();
            for (const change of entry.changes.map(change => change.text.en)) {
                expect(text).toContain(change);
            }
            for (const change of entry.changes.map(change => change.text["zh-Hant"])) {
                expect(text).not.toContain(change);
            }
        }
        expect(wrapper.text()).toContain("Changelog");
    });

    it("should show only Chinese changes in zh-Hant", async () => {
        const wrapper = mountChangelog();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        for (const entry of CHANGELOG) {
            const text = wrapper.find(`[data-testid='changelog-entry-${entry.version}']`).text();
            for (const change of entry.changes.map(change => change.text["zh-Hant"])) {
                expect(text).toContain(change);
            }
            for (const change of entry.changes.map(change => change.text.en)) {
                expect(text).not.toContain(change);
            }
        }
        expect(wrapper.text()).toContain("更新日誌");
    });

    it("should have the same number of changes in every language", () => {
        for (const changes of ALL_CHANGE_LISTS) {
            for (const locale of APP_LOCALES) {
                expect(changes.filter(change => change.text[locale].trim() !== "")).toHaveLength(changes.length);
            }
        }
    });

    it("should mark app-only changes with a badge", () => {
        const wrapper = mountChangelog();

        for (const entry of CHANGELOG) {
            const badges = wrapper.findAll(`[data-testid='changelog-entry-${entry.version}'] [data-testid='changelog-app-badge']`);
            expect(badges).toHaveLength(entry.changes.filter(change => change.appOnly).length);
        }
        const latestBadges = wrapper.findAll("[data-testid='changelog-entry-2.1.1'] [data-testid='changelog-app-badge']");
        expect(latestBadges).toHaveLength(2);
        expect(wrapper.findAll("[data-testid='changelog-entry-2.1.0'] [data-testid='changelog-app-badge']")).toHaveLength(0);
        expect(latestBadges[0].text()).toBe("App");
    });

    it("should keep the App badge apart from the change text for screen readers", () => {
        const wrapper = mountChangelog();

        const item = wrapper.find("[data-testid='changelog-entry-2.1.1'] [data-testid='changelog-app-badge']").element.parentElement;

        expect(item?.textContent).toMatch(/\S\s+App$/);
    });

    it("should keep the App marker out of the text", () => {
        for (const changes of ALL_CHANGE_LISTS) {
            for (const change of changes) {
                for (const locale of APP_LOCALES) {
                    expect(change.text[locale]).not.toMatch(/\(App\)|（App）/);
                }
            }
        }
    });

    it("should explain the App badge", () => {
        const wrapper = mountChangelog();

        expect(wrapper.find("[data-testid='changelog-app-note']").text()).toBe("Items marked App apply to the Android app only.");
    });

    it("should mark the App note for the skins", () => {
        expect(mountChangelog().get("[data-testid='changelog-app-note']").attributes("data-skin")).toBe("app-note");
    });

    it("should describe changes in players' words", () => {
        const technicalWords = /\b(PWA|manifest|launcher|gridlines?|modal|popup|toggles?|sticky|bug|solver)\b/i;
        for (const changes of ALL_CHANGE_LISTS) {
            for (const change of changes) {
                expect(change.text.en).not.toMatch(technicalWords);
                for (const word of ["PWA", "資訊清單", "格線", "對局"]) {
                    expect(change.text["zh-Hant"]).not.toContain(word);
                }
            }
        }
    });
});
