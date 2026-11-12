import {
    INK_CELEBRATION_WASH,
    INK_DRIFT_SETTLE_MS,
    INK_FILL_MS,
    INK_GROUP_MS,
    MAX_BLOOMS,
    MAX_FILLS,
    MAX_GROUPS,
    bloomProgress,
    bloomUniforms,
    fillUniforms,
    frontRadius,
    groupUniforms,
    inkFillAt,
    inkGroupMarks,
    inkFrame,
    isRunning,
    scheduleEffects,
    type InkBloom,
    type InkFill,
    type InkGroupMark,
} from "@/presentation/components/style-moments/ink/canvas/inkTimeline";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";

const BLOOM: InkBloom = { kind: "bloom", centre: { x: 0.5, y: 0.5 }, radius: 0.4, ink: 1, delayMs: 200, durationMs: 1000 };
const FILL: InkFill = { kind: "fill", cell: { row: 4, column: 2 }, seed: 3.5 };
const BOX: InkGroupMark = { kind: "group", group: { kind: "box", index: 4 }, seed: 1.25 };

describe("inkTimeline", () => {
    describe("bloomProgress", () => {
        it("should be nothing before the bloom starts, run evenly through it and hold whole after", () => {
            expect(bloomProgress(BLOOM, 0, 100)).toBe(0);
            expect(bloomProgress(BLOOM, 0, 200)).toBe(0);
            expect(bloomProgress(BLOOM, 0, 700)).toBeCloseTo(0.5);
            expect(bloomProgress(BLOOM, 0, 1200)).toBe(1);
            expect(bloomProgress(BLOOM, 0, 5000)).toBe(1);
        });

        it("should count from the moment the bloom was scheduled", () => {
            expect(bloomProgress(BLOOM, 1000, 1700)).toBeCloseTo(0.5);
        });
    });

    describe("frontRadius", () => {
        // Water spreads through paper by diffusion: the wet front runs out fast, then slows
        it("should grow with the square root of time, fast then slow", () => {
            expect(frontRadius(0, 0.4)).toBe(0);
            expect(frontRadius(0.25, 0.4)).toBeCloseTo(0.2);
            expect(frontRadius(1, 0.4)).toBeCloseTo(0.4);
            const firstQuarterGain = frontRadius(0.25, 1) - frontRadius(0, 1);
            const lastQuarterGain = frontRadius(1, 1) - frontRadius(0.75, 1);
            expect(firstQuarterGain).toBeGreaterThan(3 * lastQuarterGain);
        });
    });

    describe("INK_CELEBRATION_WASH", () => {
        it("should bloom two washes, the second a beat later, off centre and smaller", () => {
            const [first, second] = INK_CELEBRATION_WASH;

            expect(INK_CELEBRATION_WASH).toHaveLength(2);
            expect(first.centre).toEqual({ x: 0.5, y: 0.5 });
            expect(second.delayMs).toBeGreaterThan(first.delayMs);
            expect(second.radius).toBeLessThan(first.radius);
            expect(second.centre.x).toBeGreaterThan(0.5);
        });

        // The dialog opens as the first wash settles, while the second is still spreading under the scrim
        it("should settle the first wash by the time the dialog opens, the second still spreading", () => {
            const boardMs = STYLE_MOMENTS.ink.celebrationBoardMs;
            const [first, second] = INK_CELEBRATION_WASH;

            expect(first.delayMs + first.durationMs).toBeLessThanOrEqual(boardMs);
            expect(second.delayMs + second.durationMs).toBeGreaterThan(boardMs);
        });

        // The first drop's wash reaches past the board's middle, its pale tail fading out towards the edges
        it("should spread the first wash over more than half the board", () => {
            expect(INK_CELEBRATION_WASH[0].radius).toBeGreaterThan(0.5);
        });

        // The second drop lands on the first one's wash, so it carries more ink to keep the overlap deep
        it("should give the second drop more ink than the first", () => {
            const [first, second] = INK_CELEBRATION_WASH;

            expect(first.ink).toBe(1);
            expect(second.ink).toBeGreaterThan(first.ink);
        });

        it("should fit the shader's bloom slots", () => {
            expect(INK_CELEBRATION_WASH.length).toBeLessThanOrEqual(MAX_BLOOMS);
        });
    });

    describe("scheduling", () => {
        it("should run until the last effect scheduled has played and the water has settled", () => {
            const scheduled = scheduleEffects([], INK_CELEBRATION_WASH, 1000);
            const spreadMs = Math.max(...INK_CELEBRATION_WASH.map(bloom => bloom.delayMs + bloom.durationMs));
            const endMs = 1000 + Math.max(spreadMs, INK_DRIFT_SETTLE_MS);

            expect(scheduled).toHaveLength(2);
            expect(isRunning(scheduled, 1000)).toBe(true);
            expect(isRunning(scheduled, endMs - 1)).toBe(true);
            expect(isRunning(scheduled, endMs)).toBe(false);
            expect(isRunning([], 0)).toBe(false);
        });

        // The slow drift that carries the washes eases to a stop after the blooms have spread
        it("should keep running while the water still drifts, after a bloom has spread", () => {
            const scheduled = scheduleEffects([], [{ ...BLOOM, delayMs: 0 }], 0);

            expect(INK_DRIFT_SETTLE_MS).toBeGreaterThan(1000);
            expect(isRunning(scheduled, 1000)).toBe(true);
            expect(isRunning(scheduled, INK_DRIFT_SETTLE_MS)).toBe(false);
        });

        it("should add effects to the ones already scheduled, each from its own moment", () => {
            const first = scheduleEffects([], [BLOOM], 0);
            const both = scheduleEffects(first, [BLOOM], 5000);

            expect(both.map(effect => effect.scheduledAtMs)).toEqual([0, 5000]);
            expect(isRunning(first, 3000)).toBe(false);
            expect(isRunning(both, 5500)).toBe(true);
            expect(isRunning(both, 5000 + INK_DRIFT_SETTLE_MS)).toBe(false);
        });

        // The shader has a fixed number of slots; the oldest blooms make room for new ones
        it("should keep no more blooms than the shader's slots, dropping the oldest", () => {
            const many = Array.from({ length: MAX_BLOOMS + 2 }, (_, index) => ({ ...BLOOM, radius: index / 10 }));
            const scheduled = scheduleEffects([], many, 0);

            expect(scheduled).toHaveLength(MAX_BLOOMS);
            expect(scheduled[0]?.effect).toMatchObject({ radius: 0.2 });
        });
    });

    describe("bloomUniforms", () => {
        it("should give each slot its bloom's centre, front and progress, and leave the rest empty", () => {
            const scheduled = scheduleEffects([], [BLOOM], 0);
            const uniforms = bloomUniforms(scheduled, 450);

            expect(uniforms).toHaveLength(MAX_BLOOMS * 4);
            expect(uniforms[0]).toBeCloseTo(0.5);
            expect(uniforms[1]).toBeCloseTo(0.5);
            expect(uniforms[2]).toBeCloseTo(frontRadius(0.25, 0.4));
            expect(uniforms[3]).toBeCloseTo(0.25);
            expect([...uniforms.slice(4)].every(value => value === 0)).toBe(true);
        });

        it("should leave a bloom yet to start empty", () => {
            const uniforms = bloomUniforms(scheduleEffects([], [BLOOM], 0), 100);

            expect(uniforms[2]).toBe(0);
            expect(uniforms[3]).toBe(0);
        });
    });

    describe("fills", () => {
        // A drop lands under the digit as it is entered, soaks out and has faded by the time the digit settles
        it("should run a fill for as long as its drop, with no wait for the water's drift", () => {
            const scheduled = scheduleEffects([], [FILL], 1000);

            expect(INK_FILL_MS).toBeLessThan(INK_DRIFT_SETTLE_MS);
            expect(isRunning(scheduled, 1000 + INK_FILL_MS - 1)).toBe(true);
            expect(isRunning(scheduled, 1000 + INK_FILL_MS)).toBe(false);
        });

        it("should give each slot its cell's centre in grid fractions, its age in seconds and its seed, and mark the rest empty", () => {
            const uniforms = fillUniforms(scheduleEffects([], [FILL], 1000), 1300);

            expect(uniforms).toHaveLength(MAX_FILLS * 4);
            expect(uniforms[0]).toBeCloseTo(2.5 / 9);
            expect(uniforms[1]).toBeCloseTo(4.5 / 9);
            expect(uniforms[2]).toBeCloseTo(0.3);
            expect(uniforms[3]).toBeCloseTo(3.5);
            for (let slot = 1; slot < MAX_FILLS; slot++) expect(uniforms[slot * 4 + 2]).toBeLessThan(0);
        });

        // Quick fills keep their own slots; the oldest make room, and the celebration's blooms keep theirs
        it("should keep no more fills than the shader's slots, dropping the oldest and keeping every bloom", () => {
            const fills = Array.from({ length: MAX_FILLS + 2 }, (_, index): InkFill => ({ ...FILL, seed: index }));
            const scheduled = scheduleEffects(scheduleEffects([], [BLOOM], 0), fills, 100);

            expect(scheduled.filter(({ effect }) => effect.kind === "fill")).toHaveLength(MAX_FILLS);
            expect(scheduled.filter(({ effect }) => effect.kind === "bloom")).toHaveLength(1);
            expect(fillUniforms(scheduled, 200)[3]).toBe(2);
        });
    });

    describe("groups", () => {
        // A line's stroke is drawn on, held and faded by 1080ms; a box's 圓相 starts later and ends by 1220ms
        it("should run a line's stroke and a box's 圓相 each for as long as it shows", () => {
            const row = scheduleEffects([], [{ ...BOX, group: { kind: "row", index: 2 } }], 0);
            const box = scheduleEffects([], [BOX], 0);

            expect(INK_GROUP_MS.row).toBe(1080);
            expect(INK_GROUP_MS.column).toBe(1080);
            expect(INK_GROUP_MS.box).toBe(1220);
            expect(isRunning(row, 1079)).toBe(true);
            expect(isRunning(row, 1080)).toBe(false);
            expect(isRunning(box, 1219)).toBe(true);
            expect(isRunning(box, 1220)).toBe(false);
        });

        it("should give each slot its group's kind (0 row, 1 column, 2 box), index, age in seconds and seed, and mark the rest empty", () => {
            const uniforms = groupUniforms(scheduleEffects([], [{ ...BOX, group: { kind: "column", index: 7 } }, BOX], 1000), 1550);

            expect(uniforms).toHaveLength(MAX_GROUPS * 4);
            expect([...uniforms.slice(0, 2)]).toEqual([1, 7]);
            expect(uniforms[2]).toBeCloseTo(0.55);
            expect(uniforms[3]).toBeCloseTo(1.25);
            expect([...uniforms.slice(4, 6)]).toEqual([2, 4]);
            for (let slot = 2; slot < MAX_GROUPS; slot++) expect(uniforms[slot * 4]).toBeLessThan(0);
        });

        it("should keep no more groups than the shader's slots, dropping the oldest", () => {
            const groups = Array.from({ length: MAX_GROUPS + 1 }, (_, index): InkGroupMark => ({ ...BOX, group: { kind: "row", index } }));
            const scheduled = scheduleEffects(scheduleEffects([], [FILL], 0), groups, 0);

            expect(scheduled.filter(({ effect }) => effect.kind === "group")).toHaveLength(MAX_GROUPS);
            expect(groupUniforms(scheduled, 0)[1]).toBe(1);
            expect(scheduled.filter(({ effect }) => effect.kind === "fill")).toHaveLength(1);
        });
    });

    describe("making effects", () => {
        it("should drop a fill in the entered cell, each drop shaped by its own seed", () => {
            const first = inkFillAt({ row: 4, column: 2 }, 1000);
            const later = inkFillAt({ row: 4, column: 2 }, 1350);

            expect(first).toMatchObject({ kind: "fill", cell: { row: 4, column: 2 } });
            expect(first.seed).not.toBe(later.seed);
            for (const seed of [first.seed, later.seed]) {
                expect(seed).toBeGreaterThanOrEqual(0);
                expect(seed).toBeLessThan(7);
            }
        });

        // A row, a column and a box of the same index are brushed differently
        it("should mark each completed group, each with its own seed", () => {
            const marks = inkGroupMarks([{ kind: "row", index: 3 }, { kind: "column", index: 3 }, { kind: "box", index: 3 }]);

            expect(marks.map(mark => mark.group.kind)).toEqual(["row", "column", "box"]);
            expect(new Set(marks.map(mark => mark.seed)).size).toBe(3);
            expect(marks.every(mark => mark.seed >= 0 && mark.seed < 7)).toBe(true);
        });
    });

    describe("inkFrame", () => {
        it("should carry the blooms' slots, each bloom's ink and the time since the first was scheduled", () => {
            const scheduled = scheduleEffects([], [BLOOM, { ...BLOOM, ink: 1.5 }], 1000);
            const frame = inkFrame(scheduled, 1450);

            expect(frame.blooms).toEqual(bloomUniforms(scheduled, 1450));
            expect(frame.inks).toHaveLength(MAX_BLOOMS);
            expect([...frame.inks]).toEqual([1, 1.5, 0, 0]);
            expect(frame.seconds).toBeCloseTo(0.45);
        });

        it("should carry the fills' and the group marks' slots", () => {
            const scheduled = scheduleEffects([], [FILL, BOX], 1000);
            const frame = inkFrame(scheduled, 1200);

            expect(frame.fills).toEqual(fillUniforms(scheduled, 1200));
            expect(frame.groups).toEqual(groupUniforms(scheduled, 1200));
        });

        // The water's drift carries the celebration's washes; the fills before it do not start its clock
        it("should time the water's drift from the first bloom, not from a fill before it", () => {
            const filled = scheduleEffects([], [FILL], 1000);
            const frame = inkFrame(scheduleEffects(filled, [BLOOM], 1300), 1800);

            expect(frame.seconds).toBeCloseTo(0.5);
            expect(inkFrame(filled, 1500).seconds).toBe(0);
        });

        it("should count no time before anything is scheduled", () => {
            expect(inkFrame([], 500).seconds).toBe(0);
        });
    });
});
