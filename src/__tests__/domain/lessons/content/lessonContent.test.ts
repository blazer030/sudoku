import { BOARD_SIZE } from "@/domain/board/constants";
import { LESSONS } from "@/domain/lessons/content";
import { ALL_LESSON_IDS } from "@/domain/lessons/curriculum";
import type { Lesson, LessonStep, PracticeStep, StepMarks } from "@/domain/lessons/Lesson";
import { boardState } from "@/domain/lessons/lessonBoard";
import { freshPracticeState, practiceReducer, practiceValueAt, type PracticeAction, type PracticeState } from "@/domain/lessons/practice";
import { verifyLessonStep } from "@/domain/lessons/verifyLesson";
import { arePeers } from "@/domain/solver/cellRelations";
import type { CellReference } from "@/domain/solver/SolveStep";
import { en } from "@/presentation/i18n/messages/en";
import { zhHant } from "@/presentation/i18n/messages/zh-Hant";

const lessons: Lesson[] = Object.values(LESSONS);

const isPractice = (step: LessonStep): step is PracticeStep => step.kind !== "show" && step.kind !== "done";

const stringAt = (messages: object, key: string): unknown =>
    key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);

const keysOf = (step: LessonStep): string[] => {
    if (step.kind === "show") return [step.textKey];
    if (step.kind === "done") return [step.takeawayKey];
    const keys = [step.promptKey, step.successKey, ...step.hints.map(hint => hint.textKey)];
    if (step.kind === "remove") keys.push(step.keepKey, step.wrongKey);
    if (step.kind === "pick" || step.kind === "light") keys.push(step.wrongKey);
    if (step.kind === "pick" && step.order) keys.push(step.order.key);
    if (step.kind === "place" && step.notYetKey !== undefined) keys.push(step.notYetKey);
    if (step.kind === "fill") {
        if (step.notYetKey !== undefined) keys.push(step.notYetKey);
        if (step.areaKey !== undefined) keys.push(step.areaKey);
    }
    return keys;
};

// The moves that solve a step, worked out from the step's own claims
const solution = (step: PracticeStep): PracticeAction[] => {
    const tap = ({ row, column }: { row: number; column: number }): PracticeAction => ({ kind: "tapCell", row, column });
    switch (step.kind) {
        case "place":
        case "light": return [tap(step.answer)];
        case "pick": return step.targets.map(tap);
        case "remove": return step.removals.map(({ cell }) => tap(cell));
        case "note": return [{ kind: "toggleNoteMode" }, tap(step.cell), ...step.digits.map((digit): PracticeAction => ({ kind: "pressDigit", digit }))];
        case "fill": return [];
    }
};

// Where a step's answer lies; a fill step's hints are worked out from the board, and tested with the reducer
const answerCells = (step: Exclude<PracticeStep, { kind: "fill" }>): readonly CellReference[] => {
    switch (step.kind) {
        case "place":
        case "light": return [step.answer];
        case "pick": return step.targets;
        case "remove": return step.removals.map(({ cell }) => cell);
        case "note": return [step.cell];
    }
};

const cellsShownBy = (marks: StepMarks = {}): readonly CellReference[] => [
    ...(marks.lit ?? []),
    ...(marks.targets ?? []),
    ...(marks.pattern ?? []),
    ...(marks.answers ?? []).map(({ cell }) => cell),
    ...(marks.eliminated ?? []).map(({ cell }) => cell),
];

interface NamedHouse {
    house: "row" | "column" | "box";
    number: number;
}

const housesNamedInChinese = (prompt: string): NamedHouse[] =>
    [...prompt.matchAll(/第 ([\d、]+) ([列欄宮])/g)].flatMap(([, numbers, house]) =>
        numbers.split("、").map(number => ({
            house: ({ 列: "row", 欄: "column", 宮: "box" } as const)[house as "列" | "欄" | "宮"],
            number: Number(number),
        })));

const housesNamedInEnglish = (prompt: string): NamedHouse[] =>
    [...prompt.matchAll(/\b(row|column|box)(?:e?s)? (\d+(?:, \d+)*(?: and \d+)?)/gi)].flatMap(([, house, numbers]) =>
        [...numbers.matchAll(/\d+/g)].map(([number]) => ({
            house: house.toLowerCase() as NamedHouse["house"],
            number: Number(number),
        })));

const cellsOfHouse = ({ house, number }: NamedHouse): CellReference[] => {
    const cells: CellReference[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const box = Math.floor(row / 3) * 3 + Math.floor(column / 3) + 1;
            const isIn = house === "row" ? row === number - 1 : house === "column" ? column === number - 1 : box === number;
            if (isIn) cells.push({ row, column });
        }
    }
    return cells;
};

const sortedDigits = (digits: readonly number[]): number[] => [...digits].sort((first, second) => first - second);

const sortedCells = (cells: readonly CellReference[]): CellReference[] =>
    [...cells].sort((first, second) => first.row - second.row || first.column - second.column);

// The cells the player has picked by this step of the same stage
const foundBefore = (lesson: Lesson, step: PracticeStep): readonly CellReference[] =>
    lesson.steps
        .slice(0, lesson.steps.indexOf(step))
        .flatMap(earlier => (earlier.kind === "pick" && earlier.stage === step.stage ? earlier.targets : []));

const solveFill = (step: PracticeStep): PracticeState => {
    // A fill step's hints lead to a next move until it is solved, which is what a stuck player gets
    let state = freshPracticeState();
    for (let move = 0; move < 20 && !state.solved; move++) {
        for (let use = 0; use < 4; use++) state = practiceReducer(step, state, { kind: "requestHint" });
        const selected = state.selected;
        if (selected === null) throw new Error("A fill step's last hint selects no cell");
        const answer = /* digit */ fillDigit(state, step);
        state = practiceReducer(step, state, { kind: "pressDigit", digit: answer });
    }
    return state;
};

const fillDigit = (state: PracticeState, step: PracticeStep): number => {
    for (let digit = 1; digit <= 9; digit++) {
        const after = practiceReducer(step, state, { kind: "pressDigit", digit });
        if (after.placed.length > state.placed.length) return digit;
    }
    throw new Error("No digit fits the selected cell");
};

describe("the curriculum's content", () => {
    it("should have every lesson", () => {
        expect(lessons.map(lesson => lesson.id).sort()).toEqual([...ALL_LESSON_IDS].sort());
    });
});

describe.each(lessons.map(lesson => [lesson.id, lesson] as const))("lesson %s", (_, lesson) => {
    it("should run explanation, practice and closing, ending on its takeaway", () => {
        const order = ["explain", "follow", "alone", "done"];
        const stages = lesson.steps.map(step => step.stage);
        const isRulesOrInput = lesson.id === "rules" || lesson.id === "fillingIn";

        expect(stages[0]).toBe("explain");
        expect(stages[stages.length - 1]).toBe("done");
        expect(stages.filter(stage => stage === "done")).toHaveLength(1);
        expect(stages.includes("follow")).toBe(true);
        expect(stages.includes("alone")).toBe(!isRulesOrInput);
        if (!isRulesOrInput) {
            const ranks = stages.map(stage => order.indexOf(stage));
            expect(ranks).toEqual([...ranks].sort((first, second) => first - second));
        }
    });

    it("should only claim what the board and the solver back up", () => {
        for (const step of lesson.steps) expect(verifyLessonStep(step)).toEqual([]);
    });

    it("should have every word in both languages", () => {
        const keys = lesson.steps.flatMap(keysOf);

        for (const key of keys) {
            expect(typeof stringAt(en, key), `${key} in English`).toBe("string");
            expect(typeof stringAt(zhHant, key), `${key} in Chinese`).toBe("string");
        }
    });

    it("should have practice that can be solved, by a hint's lead where the digit is worked out", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            const state = step.kind === "fill"
                ? solveFill(step)
                : solution(step).reduce((current, action) => practiceReducer(step, current, action), freshPracticeState());

            expect(state.solved, step.promptKey).toBe(true);
        }
    });

    it("should have hints that end on the answer's place, for steps with their own", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            if (step.kind === "fill" || step.hints.length === 0) continue;
            expect(step.hints.length, step.promptKey).toBeGreaterThanOrEqual(2);

            const shown = cellsShownBy(step.hints[step.hints.length - 1].marks);
            for (const answer of answerCells(step)) {
                expect(shown, `${step.promptKey}, row ${answer.row} column ${answer.column}`).toContainEqual(answer);
            }
        }
    });

    it("should say why for every wrong move on an empty cell", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            const fresh = step.kind === "note" ? { ...freshPracticeState(), noteMode: true } : freshPracticeState();
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let column = 0; column < BOARD_SIZE; column++) {
                    if (practiceValueAt(step.board, fresh, { row, column }) !== 0) continue;
                    const where = `${step.promptKey}, row ${row} column ${column}`;

                    const tapped = practiceReducer(step, fresh, { kind: "tapCell", row, column });
                    const moved = tapped.solved || tapped.selected !== null || tapped.picked.length > 0 || tapped.removed.length > 0;
                    if (!moved) expect(tapped.feedback, where).not.toBeNull();
                    if (tapped.selected === null) continue;

                    for (let digit = 1; digit <= BOARD_SIZE; digit++) {
                        const pressed = practiceReducer(step, tapped, { kind: "pressDigit", digit });
                        const accepted = pressed.placed.length > 0 || pressed.notes.length > 0;
                        if (!accepted) expect(pressed.feedback, `${where}, digit ${digit}`).not.toBeNull();
                    }
                }
            }
        }
    });

    it("should leave a player on their own to find the place, with only the house the prompt names framed", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            if (step.stage !== "alone") continue;
            // Only what the player has already found is marked for them
            const found = foundBefore(lesson, step);
            for (const cell of [...(step.marks.pattern ?? []), ...(step.marks.targets ?? [])]) {
                expect(found, step.promptKey).toContainEqual(cell);
            }
            if (step.kind === "remove") expect(step.marks.pattern, step.promptKey).toEqual(step.pattern);

            for (const [language, named] of [["zh-Hant", housesNamedInChinese], ["en", housesNamedInEnglish]] as const) {
                const messages = language === "en" ? en : zhHant;
                const prompt = stringAt(messages, step.promptKey) as string;
                const framed = named(prompt).flatMap(cellsOfHouse);
                expect(sortedCells(step.marks.range ?? []), `${language}: ${prompt}`).toEqual(sortedCells(framed));
            }
        }
    });

    it("should have a player on their own find the pattern, then remove, as the guided steps taught", () => {
        for (const step of lesson.steps.filter(isPractice)) {
            if (step.stage !== "alone" || step.kind !== "remove") continue;
            const found = foundBefore(lesson, step);

            for (const cell of step.pattern) expect(found, step.promptKey).toContainEqual(cell);
        }
    });

    it("should only have notes in the lesson that teaches them, or on boards past the basics", () => {
        const isSingles = lesson.id === "hiddenSingle" || lesson.id === "nakedSingle" || lesson.id === "rules";
        for (const step of lesson.steps) {
            if (isSingles) expect(step.board.showsCandidates).toBe(false);
            else if (lesson.id !== "fillingIn" && step.kind !== "done") expect(step.board.showsCandidates).toBe(true);
        }
    });
});

describe("the order a pattern is picked in", () => {
    const ORDERS: Partial<Record<Lesson["id"], "chain" | "pivotFirst">> = { xChain: "chain", xyChain: "chain", xyWing: "pivotFirst", xyzWing: "pivotFirst" };
    const picksOf = (lesson: Lesson) => lesson.steps.filter(step => step.kind === "pick");

    it.each(lessons.map(lesson => [lesson.id, lesson] as const))("should give %s's picks an order only where its explanation has one", (id, lesson) => {
        for (const step of picksOf(lesson)) expect(step.order?.rule).toBe(ORDERS[id]);
    });

    it.each(["xChain", "xyChain"] as const)("should list %s's picks along the chain, each cell seeing the next", (id) => {
        for (const { targets } of picksOf(LESSONS[id])) {
            for (let index = 1; index < targets.length; index++) expect(arePeers(targets[index - 1], targets[index])).toBe(true);
        }
    });

    it.each(["xyWing", "xyzWing"] as const)("should list %s's pivot first, seeing every other cell", (id) => {
        for (const { targets: [pivot, ...rest] } of picksOf(LESSONS[id])) {
            for (const cell of rest) expect(arePeers(pivot, cell)).toBe(true);
        }
    });
});

describe("the W-Wing lesson", () => {
    const practiceOf = (stage: "follow" | "alone") => LESSONS.wWing.steps.filter(isPractice).filter(step => step.stage === stage);

    it.each(["follow", "alone"] as const)("should go pair, join, then removal when %s, as its explanation does", (stage) => {
        const [pair, join, remove] = practiceOf(stage);

        expect([pair.kind, join.kind, remove.kind]).toEqual(["pick", "pick", "remove"]);
        if (pair.kind !== "pick" || join.kind !== "pick" || remove.kind !== "remove") return;
        expect(sortedCells(pair.targets)).toEqual(sortedCells(remove.pattern));
        expect(join.targets).toHaveLength(2);
        for (const cell of join.targets) expect(pair.targets).not.toContainEqual(cell);
    });

    it.each([
        ["follow", 2, "row"],
        ["alone", 7, "column"],
    ] as const)("should join the pair when %s through a digit with just two places in its line", (stage, digit, line) => {
        const [, join] = practiceOf(stage);
        if (join.kind !== "pick") throw new Error("The second step picks what joins the pair");
        const state = boardState(join.board);
        const [first] = join.targets;
        const places: CellReference[] = [];
        for (let other = 0; other < BOARD_SIZE; other++) {
            const cell = line === "row" ? { row: first.row, column: other } : { row: other, column: first.column };
            if (state.candidatesOf(cell.row, cell.column).includes(digit)) places.push(cell);
        }

        expect(sortedCells(places)).toEqual(sortedCells(join.targets));
    });

    it("should have no other cell with the pair when the player is on their own, so there is one answer to find", () => {
        const [pair] = practiceOf("alone");
        if (pair.kind !== "pick") throw new Error("The first step picks the pair");
        const state = boardState(pair.board);
        const candidates = (row: number, column: number) => state.candidatesOf(row, column).join();
        const wanted = candidates(pair.targets[0].row, pair.targets[0].column);
        const holders: CellReference[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (candidates(row, column) === wanted) holders.push({ row, column });
            }
        }

        expect(sortedCells(holders)).toEqual(sortedCells(pair.targets));
    });
});

describe("the Hidden Single lesson", () => {
    const steps = LESSONS.hiddenSingle.steps;
    const tipAt = steps.findIndex(step => step.kind === "show" && step.textKey === "lessons.content.hiddenSingle.tapToLight");

    it("should teach lighting a digit before the first practice", () => {
        expect(tipAt).toBeGreaterThan(-1);
        expect(tipAt).toBeLessThan(steps.findIndex(isPractice));
    });

    it("should have the player light the digit, then look for its place with that digit held", () => {
        const [first, second] = steps.filter(isPractice);

        expect(first.kind).toBe("light");
        expect(second.kind).toBe("place");
        if (first.kind !== "light" || second.kind !== "place") return;
        expect(first.stage).toBe("follow");
        expect(second.stage).toBe("follow");
        expect(second.digit).toBe(first.digit);
        expect(second.holdsDigit).toBe(true);
    });

    it("should leave the digit free to change when the player is on their own", () => {
        const alone = steps.find(step => step.stage === "alone");

        expect(alone?.kind).toBe("place");
        if (alone?.kind === "place") expect(alone.holdsDigit).toBeUndefined();
    });

    it("should show the tip lighting every 7 on the board", () => {
        const { board, marks } = steps[tipAt];
        const sevens: CellReference[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (board.values[row * BOARD_SIZE + column] === "7") sevens.push({ row, column });
            }
        }

        expect(marks.targets).toEqual(sevens);
    });
});

describe("hidden singles in a row", () => {
    const steps = LESSONS.hiddenSingle.steps;
    const tipAt = steps.findIndex(step => step.kind === "show" && step.textKey === "lessons.content.hiddenSingle.tapToLight");
    const cellsOfRow = (row: number): CellReference[] => Array.from({ length: BOARD_SIZE }, (_, column) => ({ row, column }));
    const cellsOfBox = ({ row, column }: CellReference): CellReference[] => Array.from({ length: BOARD_SIZE }, (_, index) => ({
        row: Math.floor(row / 3) * 3 + Math.floor(index / 3),
        column: Math.floor(column / 3) * 3 + (index % 3),
    }));
    // Where the digit can still go among these cells
    const placesOf = (step: LessonStep, digit: number, among: CellReference[]): CellReference[] => {
        const state = boardState(step.board);
        return among.filter(cell => state.candidatesOf(cell.row, cell.column).includes(digit));
    };
    // Only the row gives the answer: it is the row's one place for the digit, while its box has more
    const isRowOnly = (step: LessonStep, cell: CellReference, digit: number): boolean =>
        placesOf(step, digit, cellsOfRow(cell.row)).length === 1 && placesOf(step, digit, cellsOfBox(cell)).length >= 2;

    it("should show a hidden single that only its row gives, before the tip on lighting digits", () => {
        const rowExamples = steps.slice(0, tipAt).filter(step => (step.marks.answers ?? [])
            .some(({ cell, digit }) => isRowOnly(step, cell, digit)));

        expect(rowExamples.length).toBeGreaterThan(0);
    });

    it("should have the player place a digit that only its row gives", () => {
        const rowSteps = steps.filter(step => step.kind === "place" && step.stage === "follow" && isRowOnly(step, step.answer, step.digit));

        expect(rowSteps).toHaveLength(1);
        const [rowStep] = rowSteps;
        if (rowStep.kind !== "place") return;
        expect(sortedCells(rowStep.range ?? [])).toEqual(sortedCells(cellsOfRow(rowStep.answer.row)));
        expect(rowStep.holdsDigit).toBe(true);
    });
});

describe("following a supposed digit to a dead end", () => {
    const steps = LESSONS.hiddenSingle.steps;
    const indexOf = (name: string) => steps.findIndex(step => step.kind === "show" && step.textKey === `lessons.content.hiddenSingle.${name}`);
    const supposing = steps.flatMap((step, index) => ((step.marks.supposed ?? []).length > 0 ? [index] : []));

    it("should come after the row explanation and before the tip on lighting digits", () => {
        expect(supposing.length).toBeGreaterThan(0);
        expect(supposing[0]).toBeGreaterThan(indexOf("boxesFirst"));
        expect(supposing[supposing.length - 1]).toBeLessThan(indexOf("tapToLight"));
    });

    it("should suppose one digit, add one at each step, and end on a contradiction that refutes the first", () => {
        const runs = supposing.map(index => steps[index]);
        const last = runs[runs.length - 1];
        // The last step adds no digit: it frames the house the digits so far leave empty
        runs.slice(0, -1).forEach((step, order) => { expect(step.marks.supposed).toHaveLength(order + 1); });
        expect(last.marks.supposed).toHaveLength(runs.length - 1);

        expect(last.kind === "show" && last.contradiction !== undefined).toBe(true);
        expect(last.marks.refuted).toEqual([runs[0].marks.supposed?.[0].cell]);
    });

    it("should frame the contradiction's house and cross every cell in it the supposed digits leave empty", () => {
        const last = steps[supposing[supposing.length - 1]];
        const range = last.kind === "show" ? last.contradiction?.range ?? [] : [];
        const state = boardState(last.board);
        const supposed = (last.marks.supposed ?? []).map(({ cell }) => cell);
        const empty = range.filter(cell => state.valueAt(cell.row, cell.column) === 0
            && !supposed.some(other => other.row === cell.row && other.column === cell.column));

        expect(range.length).toBeGreaterThan(0);
        expect(sortedCells(last.marks.range ?? [])).toEqual(sortedCells(range));
        expect(sortedCells(last.marks.crossed ?? [])).toEqual(sortedCells(empty));
    });

    it("should close with a step that supposes nothing", () => {
        const after = steps[supposing[supposing.length - 1] + 1];

        expect(after.kind).toBe("show");
        expect(after.marks.supposed).toBeUndefined();
    });
});

describe("the step into the Medium group", () => {
    it("should open Pointing with the whole board and every candidate, nothing dimmed", () => {
        const [first] = LESSONS.pointing.steps;

        expect(first.kind).toBe("show");
        expect(first.board.showsCandidates).toBe(true);
        expect(first.marks.dimOthers).toBeUndefined();
        expect(first.marks.noteDigit).toBeUndefined();
        expect(first.marks.range).toBeUndefined();
    });
});

describe("counter-examples", () => {
    const showStep = (lesson: Lesson, name: string): LessonStep | undefined =>
        lesson.steps.find(step => step.kind === "show" && step.textKey === `lessons.content.${lesson.id}.${name}`);
    const distinct = (values: number[]) => new Set(values).size;
    const boxNumber = ({ row, column }: CellReference) => Math.floor(row / 3) * 3 + Math.floor(column / 3);

    // The marked cells are every place the step's digit has in its house, and nothing is removed
    const expectWholeHouse = (step: LessonStep | undefined, inHouse: (cell: CellReference) => boolean) => {
        expect(step).toBeDefined();
        if (step === undefined) return [];
        const digit = step.marks.noteDigit ?? 0;
        const state = boardState(step.board);
        const places: CellReference[] = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let column = 0; column < BOARD_SIZE; column++) {
                if (inHouse({ row, column }) && state.candidatesOf(row, column).includes(digit)) places.push({ row, column });
            }
        }
        expect(sortedCells(step.marks.pattern ?? [])).toEqual(sortedCells(places));
        expect(step.marks.eliminated).toBeUndefined();
        return places;
    };

    it("should show a box whose candidates for a digit lie on more than one row and column", () => {
        const step = showStep(LESSONS.pointing, "notOneLine");
        const box = step?.marks.pattern?.[0];
        const places = expectWholeHouse(step, cell => box !== undefined && boxNumber(cell) === boxNumber(box));

        expect(distinct(places.map(cell => cell.row))).toBeGreaterThan(1);
        expect(distinct(places.map(cell => cell.column))).toBeGreaterThan(1);
    });

    it("should show a row whose candidates for a digit lie in more than one box", () => {
        const step = showStep(LESSONS.claiming, "notOneBox");
        const row = step?.marks.pattern?.[0]?.row;
        const places = expectWholeHouse(step, cell => cell.row === row);

        expect(distinct(places.map(boxNumber))).toBeGreaterThan(1);
    });
});

describe("search tips", () => {
    const showStep = (lesson: Lesson, name: string): LessonStep | undefined =>
        lesson.steps.find(step => step.kind === "show" && step.textKey === `lessons.content.${lesson.id}.${name}`);
    const allCells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({ row: Math.floor(index / BOARD_SIZE), column: index % BOARD_SIZE }));

    it("should mark only rows where X-Wing's digit has exactly two places, and those places", () => {
        const step = showStep(LESSONS.xWing, "findIt");
        expect(step).toBeDefined();
        if (step === undefined) return;
        const digit = step.marks.noteDigit ?? 0;
        const state = boardState(step.board);
        const rows = [...new Set((step.marks.range ?? []).map(cell => cell.row))];
        const places = rows.map(row => allCells.filter(cell => cell.row === row && state.candidatesOf(row, cell.column).includes(digit)));

        expect(rows.length).toBeGreaterThan(1);
        for (const placesInRow of places) expect(placesInRow).toHaveLength(2);
        expect(sortedCells(step.marks.pattern ?? [])).toEqual(sortedCells(places.flat()));
    });

    it("should mark XY-Wing's two-candidate cells, all of them and nothing else", () => {
        const step = showStep(LESSONS.xyWing, "findIt");
        expect(step).toBeDefined();
        if (step === undefined) return;
        const state = boardState(step.board);
        const twoCandidates = allCells.filter(cell => state.candidatesOf(cell.row, cell.column).length === 2);

        expect(sortedCells(step.marks.pattern ?? [])).toEqual(sortedCells(twoCandidates));
    });

    it("should show an XY-Wing whose shared digit is in no cell that sees both ends", () => {
        const step = showStep(LESSONS.xyWing, "nothingWhy");
        expect(step).toBeDefined();
        if (step === undefined) return;
        const state = boardState(step.board);
        const candidates = (cell: CellReference) => state.candidatesOf(cell.row, cell.column);
        const [pivot, firstEnd, secondEnd] = step.marks.pattern ?? [];
        const [shared] = step.marks.emphasized ?? [];
        const [x, y] = candidates(pivot);

        expect(candidates(pivot)).toHaveLength(2);
        expect(arePeers(pivot, firstEnd) && arePeers(pivot, secondEnd)).toBe(true);
        expect(sortedDigits(candidates(firstEnd))).toEqual(sortedDigits([x, shared]));
        expect(sortedDigits(candidates(secondEnd))).toEqual(sortedDigits([y, shared]));
        const seers = allCells.filter(cell => arePeers(cell, firstEnd) && arePeers(cell, secondEnd));
        expect(seers.filter(cell => candidates(cell).includes(shared))).toEqual([]);
        expect(step.marks.eliminated).toBeUndefined();
    });
});

describe("complementary subsets", () => {
    const steps = LESSONS.hiddenSubset.steps;
    const indexOf = (name: string) => steps.findIndex(step => step.kind === "show" && step.textKey === `lessons.content.hiddenSubset.${name}`);

    it("should mark, after the hidden triple, the house's other empty cells as a naked group of two to four", () => {
        const at = indexOf("complement");
        expect(at).toBeGreaterThan(indexOf("remove"));
        const step = steps[at];
        const cells = step.marks.pattern ?? [];
        const state = boardState(step.board);
        const digits = new Set(cells.flatMap(cell => state.candidatesOf(cell.row, cell.column)));
        const tripleCells = steps[indexOf("remove")].marks.pattern ?? [];
        const [first] = tripleCells;
        const sameRow = tripleCells.every(cell => cell.row === first.row);
        const house = Array.from({ length: BOARD_SIZE }, (_, index) => (sameRow ? { row: first.row, column: index } : { row: index, column: first.column }));
        const otherEmpty = house.filter(cell => state.valueAt(cell.row, cell.column) === 0
            && !tripleCells.some(triple => triple.row === cell.row && triple.column === cell.column));

        expect(cells.length).toBeGreaterThanOrEqual(2);
        expect(cells.length).toBeLessThanOrEqual(4);
        expect(digits.size).toBe(cells.length);
        expect(sortedCells(cells)).toEqual(sortedCells(otherEmpty));
    });
});

describe("one claim per explanation step", () => {
    const indexOf = (lesson: Lesson, name: string) =>
        lesson.steps.findIndex(step => step.kind === "show" && step.textKey === `lessons.content.${lesson.id}.${name}`);

    it.each(["caseFive", "caseNine"])("should light only XYZ-Wing's pivot and the end its %s step names", (name) => {
        const lesson = LESSONS.xyzWing;
        const step = lesson.steps[indexOf(lesson, name)];
        const [pivot] = step.marks.pattern ?? [];

        expect(step.marks.lit).toHaveLength(2);
        expect(step.marks.lit).toContainEqual(pivot);
    });

    it("should light a different end of XYZ-Wing in each of its two cases", () => {
        const lesson = LESSONS.xyzWing;
        const endOf = (name: string) => {
            const step = lesson.steps[indexOf(lesson, name)];
            const [pivot] = step.marks.pattern ?? [];
            const end = (step.marks.lit ?? []).find(cell => cell.row !== pivot.row || cell.column !== pivot.column);
            expect(step.marks.pattern).toContainEqual(end);
            return end;
        };

        expect(endOf("caseFive")).not.toEqual(endOf("caseNine"));
    });

    it.each([
        ["fish", "jellyfish", "jellyfishRemove", "jellyfish"],
        ["xyzWing", "wxyz", "wxyzRemove", "wxyzWing"],
    ] as const)("should show %s's %s pattern with nothing removed, then the removal in its own step", (id, patternName, removalName, technique) => {
        const lesson = LESSONS[id];
        const at = indexOf(lesson, patternName);
        const pattern = lesson.steps[at];
        const removal = lesson.steps[at + 1];

        expect(at).toBeGreaterThan(-1);
        expect(pattern.marks.eliminated).toBeUndefined();
        expect(removal.kind === "show" && removal.textKey).toBe(`lessons.content.${id}.${removalName}`);
        expect(removal.kind === "show" && removal.technique).toBe(technique);
        expect(removal.marks.eliminated?.length).toBeGreaterThan(0);
    });

    it("should narrow X-Wing's search from the rows with two places to the two that share columns, in the next step", () => {
        const lesson = LESSONS.xWing;
        const at = indexOf(lesson, "findIt");
        const search = lesson.steps[at];
        const match = lesson.steps[at + 1];
        const rowsOf = (cells: readonly CellReference[]) => [...new Set(cells.map(cell => cell.row))];
        const columnsIn = (row: number) => (search.marks.pattern ?? []).filter(cell => cell.row === row).map(cell => cell.column).join();
        const [first, ...others] = rowsOf(match.marks.pattern ?? []);

        expect(match.kind === "show" && match.textKey).toBe("lessons.content.xWing.findMatch");
        expect(others).toHaveLength(1);
        expect(columnsIn(others[0])).toBe(columnsIn(first));
        expect(sortedCells(match.marks.pattern ?? [])).toEqual(sortedCells((search.marks.pattern ?? []).filter(cell => cell.row === first || cell.row === others[0])));
        expect(rowsOf(search.marks.range ?? []).length).toBeGreaterThan(2);
    });

    it.each([
        ["pointing", "toCandidates", "autoNotes"],
        ["hiddenSubset", "complementWhy", "complementSize"],
        ["xyWing", "findIt", "findPivot"],
        ["xyWing", "nothingToRemove", "nothingWhy"],
    ] as const)("should follow %s's %s with %s, on the same board and marks", (id, name, nextName) => {
        const lesson = LESSONS[id];
        const at = indexOf(lesson, name);
        const step = lesson.steps[at];
        const next = lesson.steps[at + 1];

        expect(at).toBeGreaterThan(-1);
        expect(next.kind === "show" && next.textKey).toBe(`lessons.content.${id}.${nextName}`);
        expect(next.board).toBe(step.board);
        expect(next.marks).toEqual(step.marks);
    });
});

describe("the Filling in lesson", () => {
    it("should point at its cells rather than name them, as it comes before the lesson on rows and columns", () => {
        for (const step of LESSONS.fillingIn.steps) {
            for (const key of keysOf(step)) {
                expect(stringAt(zhHant, key), key).not.toMatch(/[列欄宮]/);
                expect(stringAt(en, key), key).not.toMatch(/\b(row|column|box)\b/i);
            }
        }
    });

    it("should dim nothing, as working out a cell takes the digits around it", () => {
        for (const step of LESSONS.fillingIn.steps) {
            expect(step.marks.dimOthers).toBeUndefined();
            expect(step.marks.noteDigit).toBeUndefined();
        }
    });
});
