import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Changelog from "@/presentation/pages/settings/Changelog.vue";
import { i18n } from "@/presentation/i18n";
import { CHANGELOG } from "@/presentation/pages/settings/changelogData";
import { APP_LOCALES } from "@/application/SettingsStorage";

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

describe("Changelog", () => {
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
        for (const entry of CHANGELOG) {
            for (const locale of APP_LOCALES) {
                expect(entry.changes.filter(change => change.text[locale].trim() !== "")).toHaveLength(entry.changes.length);
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
        for (const entry of CHANGELOG) {
            for (const change of entry.changes) {
                for (const locale of APP_LOCALES) {
                    expect(change.text[locale]).not.toMatch(/\(App\)|（App）/);
                }
            }
        }
    });

    it("should explain the App badge", async () => {
        const wrapper = mountChangelog();

        expect(wrapper.find("[data-testid='changelog-app-note']").text()).toBe("Items marked App apply to the Android app only.");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        expect(wrapper.find("[data-testid='changelog-app-note']").text()).toBe("標有 App 的項目只適用於 Android App。");
    });

    it("should describe changes in players' words", () => {
        const technicalWords = /\b(PWA|manifest|launcher|gridlines?|modal|popup|toggles?|sticky|bug|solver)\b/i;
        for (const entry of CHANGELOG) {
            for (const change of entry.changes) {
                expect(change.text.en).not.toMatch(technicalWords);
                for (const word of ["PWA", "資訊清單", "格線", "對局"]) {
                    expect(change.text["zh-Hant"]).not.toContain(word);
                }
            }
        }
        const release210 = CHANGELOG.find(entry => entry.version === "2.1.0");
        expect(release210?.changes.map(change => change.text["zh-Hant"])).toContain("解題演示在小螢幕上的畫面更整齊");
    });
});
