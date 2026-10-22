import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import type { CellReference, SolveStep, TechniqueId } from "@/domain/solver/SolveStep";
import { useHintExplanation } from "@/presentation/components/step-presentation/useHintExplanation";

type Explain = ReturnType<typeof useHintExplanation>;

type ExplainTechnique = (technique: TechniqueId) => string;

const mountExplanation = (): ExplainTechnique => {
    let explain!: Explain;
    const Host = defineComponent({
        setup() {
            explain = useHintExplanation();
            return () => null;
        },
    });
    mount(Host);
    return (technique) => explain(STEPS[technique], candidatesBefore(technique));
};

const useChinese = async (): Promise<void> => {
    i18n.global.locale.value = "zh-Hant";
    await nextTick();
};

const cell = (row: number, column: number): CellReference => ({ row, column });

const removing = (digit: number, ...cells: CellReference[]) =>
    cells.map((target) => ({ cell: target, digit }));

const STEPS: Record<TechniqueId, SolveStep> = {
    nakedSingle: {
        technique: "nakedSingle",
        focus: [cell(2, 4)],
        assignments: [{ cell: cell(2, 4), digit: 7 }],
        eliminations: [],
        scopes: [],
    },
    hiddenSingle: {
        technique: "hiddenSingle",
        focus: [cell(4, 7)],
        assignments: [{ cell: cell(4, 7), digit: 2 }],
        eliminations: [],
        scopes: [{ kind: "box", boxRow: 3, boxColumn: 6 }],
    },
    nakedPair: {
        technique: "nakedPair",
        focus: [cell(0, 1), cell(0, 6)],
        assignments: [],
        eliminations: removing(3, cell(0, 3), cell(0, 4)),
        scopes: [{ kind: "row", row: 0 }],
    },
    nakedTriple: {
        technique: "nakedTriple",
        focus: [cell(1, 0), cell(4, 0), cell(7, 0)],
        assignments: [],
        eliminations: removing(6, cell(2, 0)),
        scopes: [{ kind: "column", column: 0 }],
    },
    nakedQuad: {
        technique: "nakedQuad",
        focus: [cell(0, 0), cell(0, 2), cell(2, 0), cell(2, 2)],
        assignments: [],
        eliminations: removing(9, cell(1, 1)),
        scopes: [{ kind: "box", boxRow: 0, boxColumn: 0 }],
    },
    hiddenPair: {
        technique: "hiddenPair",
        focus: [cell(5, 2), cell(5, 8)],
        assignments: [],
        eliminations: [...removing(4, cell(5, 2)), ...removing(6, cell(5, 8))],
        scopes: [{ kind: "row", row: 5 }],
    },
    hiddenTriple: {
        technique: "hiddenTriple",
        focus: [cell(0, 3), cell(4, 3), cell(8, 3)],
        assignments: [],
        eliminations: removing(1, cell(4, 3)),
        scopes: [{ kind: "column", column: 3 }],
    },
    hiddenQuad: {
        technique: "hiddenQuad",
        focus: [cell(6, 6), cell(6, 8), cell(7, 7), cell(8, 6)],
        assignments: [],
        eliminations: removing(2, cell(7, 7)),
        scopes: [{ kind: "box", boxRow: 6, boxColumn: 6 }],
    },
    pointing: {
        technique: "pointing",
        focus: [cell(4, 0), cell(4, 1)],
        assignments: [],
        eliminations: removing(7, cell(4, 5)),
        scopes: [
            { kind: "box", boxRow: 3, boxColumn: 0 },
            { kind: "row", row: 4 },
        ],
    },
    claiming: {
        technique: "claiming",
        focus: [cell(0, 7), cell(2, 7)],
        assignments: [],
        eliminations: removing(8, cell(1, 6)),
        scopes: [
            { kind: "column", column: 7 },
            { kind: "box", boxRow: 0, boxColumn: 6 },
        ],
    },
    xWing: {
        technique: "xWing",
        focus: [cell(1, 2), cell(1, 7), cell(5, 2), cell(5, 7)],
        assignments: [],
        eliminations: removing(7, cell(0, 2), cell(3, 2), cell(8, 7)),
        scopes: [
            { kind: "row", row: 1 },
            { kind: "row", row: 5 },
            { kind: "column", column: 2 },
            { kind: "column", column: 7 },
        ],
    },
    swordfish: {
        technique: "swordfish",
        focus: [cell(1, 0), cell(3, 4), cell(6, 8), cell(1, 4)],
        assignments: [],
        eliminations: removing(4, cell(1, 2), cell(6, 5)),
        scopes: [
            { kind: "column", column: 0 },
            { kind: "column", column: 4 },
            { kind: "column", column: 8 },
            { kind: "row", row: 1 },
            { kind: "row", row: 3 },
            { kind: "row", row: 6 },
        ],
    },
    jellyfish: {
        technique: "jellyfish",
        focus: [cell(0, 1), cell(2, 3), cell(5, 5), cell(7, 8)],
        assignments: [],
        eliminations: removing(5, cell(4, 1)),
        scopes: [
            { kind: "row", row: 0 },
            { kind: "row", row: 2 },
            { kind: "row", row: 5 },
            { kind: "row", row: 7 },
            { kind: "column", column: 1 },
            { kind: "column", column: 3 },
            { kind: "column", column: 5 },
            { kind: "column", column: 8 },
        ],
    },
    xyWing: {
        technique: "xyWing",
        focus: [cell(0, 0), cell(0, 5), cell(4, 0)],
        assignments: [],
        eliminations: removing(3, cell(4, 5)),
        scopes: [],
    },
    wWing: {
        technique: "wWing",
        focus: [cell(1, 1), cell(6, 7)],
        supporters: [cell(1, 4), cell(6, 4)],
        assignments: [],
        eliminations: removing(5, cell(1, 7)),
        scopes: [{ kind: "column", column: 4 }],
    },
    xyzWing: {
        technique: "xyzWing",
        focus: [cell(3, 3), cell(3, 5), cell(5, 4)],
        assignments: [],
        eliminations: removing(2, cell(3, 4)),
        scopes: [],
    },
    wxyzWing: {
        technique: "wxyzWing",
        focus: [cell(7, 1), cell(7, 4), cell(8, 0), cell(6, 2)],
        assignments: [],
        eliminations: removing(6, cell(7, 0)),
        scopes: [],
    },
    xChain: {
        technique: "xChain",
        focus: [cell(0, 0), cell(0, 4), cell(3, 4), cell(3, 8)],
        assignments: [],
        eliminations: removing(9, cell(0, 8)),
        scopes: [],
        chainLinks: [
            { from: cell(0, 0), to: cell(0, 4), digit: 9, type: "strong" },
            { from: cell(0, 4), to: cell(3, 4), digit: 9, type: "weak" },
            { from: cell(3, 4), to: cell(3, 8), digit: 9, type: "strong" },
        ],
    },
    xyChain: {
        technique: "xyChain",
        focus: [cell(8, 0), cell(8, 3), cell(5, 3), cell(5, 6)],
        assignments: [],
        eliminations: removing(1, cell(8, 6)),
        scopes: [],
        chainLinks: [
            { from: cell(8, 0), to: cell(8, 3), digit: 4, type: "weak" },
            { from: cell(8, 3), to: cell(5, 3), digit: 8, type: "weak" },
            { from: cell(5, 3), to: cell(5, 6), digit: 2, type: "weak" },
        ],
    },
};

// Candidates of the cells each explanation reads, before the step; every other cell is empty.
const CANDIDATES: Partial<Record<TechniqueId, [CellReference, number[]][]>> = {
    nakedPair: [[cell(0, 1), [3, 8]], [cell(0, 6), [3, 8]]],
    nakedTriple: [[cell(1, 0), [1, 6]], [cell(4, 0), [6, 9]], [cell(7, 0), [1, 9]]],
    nakedQuad: [[cell(0, 0), [2, 4]], [cell(0, 2), [4, 7]], [cell(2, 0), [7, 9]], [cell(2, 2), [2, 9]]],
    hiddenPair: [[cell(5, 2), [1, 4, 7]], [cell(5, 8), [1, 6, 7]]],
    hiddenTriple: [[cell(0, 3), [2, 3, 5]], [cell(4, 3), [1, 3, 5]], [cell(8, 3), [2, 5]]],
    hiddenQuad: [[cell(6, 6), [3, 6]], [cell(6, 8), [6, 8]], [cell(7, 7), [2, 3, 9]], [cell(8, 6), [8, 9]]],
    xyWing: [[cell(0, 0), [1, 5]], [cell(0, 5), [1, 3]], [cell(4, 0), [3, 5]]],
    wWing: [[cell(1, 1), [5, 7]], [cell(6, 7), [5, 7]]],
};

const candidatesBefore = (technique: TechniqueId): number[][][] => {
    const grid = Array.from({ length: 9 }, () => Array.from({ length: 9 }, (): number[] => []));
    for (const [reference, digits] of CANDIDATES[technique] ?? []) grid[reference.row][reference.column] = digits;
    return grid;
};

const TECHNIQUES = Object.keys(STEPS) as TechniqueId[];

const stepCells = (step: SolveStep): CellReference[] => [
    ...step.focus,
    ...(step.supporters ?? []),
    ...step.eliminations.map((elimination) => elimination.cell),
    ...step.assignments.map((assignment) => assignment.cell),
];

const englishPosition = (reference: CellReference): string =>
    `Row ${reference.row + 1}, Col ${reference.column + 1}`;

describe("useHintExplanation", () => {
    describe.each(TECHNIQUES)("%s", (technique) => {
        const step = STEPS[technique];

        it("should name a cell of the step in English", () => {
            const explain = mountExplanation();

            const sentence = explain(technique);

            expect(sentence.length).toBeGreaterThan(0);
            expect(stepCells(step).some((reference) => sentence.includes(englishPosition(reference)))).toBe(true);
        });
    });

    it("should give every technique its own English sentence", () => {
        const explain = mountExplanation();

        const sentences = TECHNIQUES.map(explain);

        expect(new Set(sentences).size).toBe(TECHNIQUES.length);
    });

    it("should explain a naked single in Chinese as the only candidate left", async () => {
        const explain = mountExplanation();
        await useChinese();

        expect(explain("nakedSingle")).toBe("第 3 列第 5 欄只剩 7 這個候選數，所以填入 7。");
    });

    it("should number boxes from the top left to the bottom right", () => {
        const explain = mountExplanation();

        expect(explain("hiddenSingle")).toContain("box 6");
        expect(explain("pointing")).toContain("box 4");
    });

    it("should name the base and cover lines of a fish", () => {
        const explain = mountExplanation();

        const english = explain("xWing");
        expect(english).toContain("rows 2 and 6");
        expect(english).toContain("columns 3 and 8");
    });

    it("should name the digits a naked subset is limited to and the digits it removes", () => {
        const explain = mountExplanation();

        expect(explain("nakedPair")).toContain("can only be 3 or 8");
        expect(explain("nakedPair")).toContain("Remove 3 from the rest of row 1");
        expect(explain("nakedTriple")).toContain("can only be 1, 6 or 9");
    });

    it("should name the hidden digits of a hidden subset and its other candidates", () => {
        const explain = mountExplanation();

        expect(explain("hiddenPair")).toContain("The only spots for 1 and 7 in row 6");
        expect(explain("hiddenPair")).toContain("(4 and 6)");
        expect(explain("hiddenTriple")).toContain("The only spots for 2, 3 and 5 in column 4");
    });

    it("should name the pair and the link digit of a W-Wing", () => {
        const explain = mountExplanation();

        expect(explain("wWing")).toContain("can only be 5 or 7");
        expect(explain("wWing")).toContain("7 has just two spots in column 5");
    });

    it("should name the two digits of an XY-Wing pivot", () => {
        const explain = mountExplanation();

        expect(explain("xyWing")).toContain("Row 1, Col 1 is 1 or 5");
    });

    it("should name the first target and count the rest when many cells lose a candidate", () => {
        const explain = mountExplanation();

        expect(explain("xWing")).toContain("Row 1, Col 3 and 2 other cells");
    });
});
