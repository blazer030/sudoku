import { mount } from "@vue/test-utils";
import { ListFilter } from "lucide-vue-next";
import StepTag from "@/presentation/components/step-presentation/StepTag.vue";

const mountTag = (strong: boolean) =>
    mount(StepTag, { props: { label: "Hidden Single", icon: ListFilter, strong, stepKey: 0, testId: "demo-tag" } });

const skinTokensOf = (strong: boolean): string[] =>
    (mountTag(strong).find("[data-testid='demo-tag']").attributes("data-skin") ?? "").split(/\s+/);

describe("StepTag", () => {
    it("should carry the step tag's skin hook, so a style can draw it", () => {
        expect(skinTokensOf(false)).toEqual(expect.arrayContaining(["tag", "step"]));
        expect(skinTokensOf(true)).toEqual(expect.arrayContaining(["tag", "step"]));
    });

    it("should mark the step that settles something as strong, and only that one", () => {
        expect(skinTokensOf(true)).toContain("strong");
        expect(skinTokensOf(false)).not.toContain("strong");
    });
});
