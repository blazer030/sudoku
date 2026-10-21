import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Changelog from "@/presentation/pages/settings/Changelog.vue";
import { i18n } from "@/presentation/i18n";
import { CHANGELOG } from "@/presentation/pages/settings/changelogData";

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
        for (const change of latest.changes.en) {
            expect(entry.text()).toContain(change);
        }
    });

    it("should show only English changes in English", () => {
        const wrapper = mountChangelog();

        for (const entry of CHANGELOG) {
            const text = wrapper.find(`[data-testid='changelog-entry-${entry.version}']`).text();
            for (const change of entry.changes.en) {
                expect(text).toContain(change);
            }
            for (const change of entry.changes["zh-Hant"]) {
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
            for (const change of entry.changes["zh-Hant"]) {
                expect(text).toContain(change);
            }
            for (const change of entry.changes.en) {
                expect(text).not.toContain(change);
            }
        }
        expect(wrapper.text()).toContain("更新日誌");
    });

    it("should have the same number of changes in every language", () => {
        for (const entry of CHANGELOG) {
            expect(entry.changes["zh-Hant"]).toHaveLength(entry.changes.en.length);
        }
    });
});
