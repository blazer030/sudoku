import { minimumPanelHeight, panelLift } from "@/presentation/pages/game/hint-mode/panelLift";

const panelWith = (scrollHeight: number, explanation: { height: number; minHeight: string } | null): HTMLElement => {
    const panel = document.createElement("div");
    Object.defineProperty(panel, "scrollHeight", { value: scrollHeight });
    if (explanation !== null) {
        const region = document.createElement("div");
        region.dataset.testid = "hint-explanation-region";
        region.style.minHeight = explanation.minHeight;
        Object.defineProperty(region, "clientHeight", { value: explanation.height });
        panel.appendChild(region);
    }
    return panel;
};

describe("panelLift", () => {
    it("should not lift a panel that fits its room", () => {
        expect(panelLift(200, 190)).toBe(0);
    });

    it("should lift the panel by the part that does not fit", () => {
        expect(panelLift(114, 190)).toBe(76);
    });

    it("should round a fractional shortfall up so the last pixel shows", () => {
        expect(panelLift(114.5, 190)).toBe(76);
    });
});

describe("minimumPanelHeight", () => {
    it("should count the explanation at its smallest height", () => {
        // 230 tall with a 74px explanation that may shrink to 23px
        expect(minimumPanelHeight(panelWith(230, { height: 74, minHeight: "23px" }))).toBe(179);
    });

    it("should take the overflowing height when the explanation has already shrunk", () => {
        expect(minimumPanelHeight(panelWith(190, { height: 23, minHeight: "23px" }))).toBe(190);
    });

    it("should use the whole height of a panel without an explanation", () => {
        expect(minimumPanelHeight(panelWith(150, null))).toBe(150);
    });
});
