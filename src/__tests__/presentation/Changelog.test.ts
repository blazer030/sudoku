import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Changelog from "@/presentation/pages/settings/Changelog.vue";
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
        for (const change of latest.changes) {
            expect(entry.text()).toContain(change);
        }
    });
});
