import { at, boxOf, cells, columnOf, link, removal, rowOf } from "@/domain/lessons/content/helpers";
import type { Lesson, LessonBoard } from "@/domain/lessons/Lesson";
import type { Elimination } from "@/domain/solver/SolveStep";

const key = (lesson: string, name: string) => `lessons.content.${lesson}.${name}`;

const board = (values: string, ...removedCandidates: readonly Elimination[]): LessonBoard => ({
    values,
    showsCandidates: true,
    ...(removedCandidates.length > 0 ? { removedCandidates } : {}),
});

// X-Wing: rows 1 and 7 hold the 4s in columns 3 and 7
const X_WING_SHOW_BOARD = board("280165039061938520359472861138594276672381945945627183890716052500040600006050000");
const X_WING_SHOW_CORNERS = cells([1, 3], [1, 7], [7, 3], [7, 7]);
const X_WING_SHOW_ROW_LINKS = [link([1, 3], [1, 7], 4), link([7, 3], [7, 7], 4)];
const X_WING_SHOW_LINKS = [...X_WING_SHOW_ROW_LINKS, link([1, 3], [7, 3], 4, "weak"), link([1, 7], [7, 7], 4, "weak")];
const X_WING_SHOW_MARKS = { noteDigit: 4, emphasized: [4], dimOthers: true };

// Rows 3 and 6 hold the 6s in columns 2 and 7
const X_WING_FOLLOW_BOARD = board("804269105290175480105348092058794201419632857702851049927480510080517924541920008");
const X_WING_FOLLOW_CORNERS = cells([3, 2], [3, 7], [6, 2], [6, 7]);
const X_WING_FOLLOW_LINKS = [link([3, 2], [3, 7], 6), link([6, 2], [6, 7], 6), link([3, 2], [6, 2], 6, "weak"), link([3, 7], [6, 7], 6, "weak")];

// This time columns 3 and 4 hold the 1s, in rows 5 and 7
const X_WING_ALONE_BOARD = board("954317286312468579867952134073094821420080097089270045230049768048726903796830402");
const X_WING_ALONE_CORNERS = cells([5, 3], [7, 3], [5, 4], [7, 4]);

export const X_WING: Lesson = {
    id: "xWing",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: X_WING_SHOW_BOARD,
            marks: { ...X_WING_SHOW_MARKS, range: rowOf(1), pattern: cells([1, 3], [1, 7]), links: [X_WING_SHOW_ROW_LINKS[0]] },
            textKey: key("xWing", "rowOne"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_WING_SHOW_BOARD,
            marks: { ...X_WING_SHOW_MARKS, range: [...rowOf(1), ...rowOf(7)], pattern: X_WING_SHOW_CORNERS, links: X_WING_SHOW_ROW_LINKS },
            textKey: key("xWing", "rowTwo"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_WING_SHOW_BOARD,
            marks: { ...X_WING_SHOW_MARKS, pattern: X_WING_SHOW_CORNERS, lit: cells([1, 3], [7, 7]), links: X_WING_SHOW_LINKS },
            textKey: key("xWing", "caseOne"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_WING_SHOW_BOARD,
            marks: { ...X_WING_SHOW_MARKS, pattern: X_WING_SHOW_CORNERS, lit: cells([1, 7], [7, 3]), links: X_WING_SHOW_LINKS },
            textKey: key("xWing", "caseTwo"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_WING_SHOW_BOARD,
            marks: { ...X_WING_SHOW_MARKS, range: [...columnOf(3), ...columnOf(7)], pattern: X_WING_SHOW_CORNERS, links: X_WING_SHOW_LINKS },
            textKey: key("xWing", "bothCases"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_WING_SHOW_BOARD,
            marks: {
                ...X_WING_SHOW_MARKS,
                range: [...columnOf(3), ...columnOf(7)],
                pattern: X_WING_SHOW_CORNERS,
                links: X_WING_SHOW_LINKS,
                eliminated: [removal(9, 7, 4)],
            },
            textKey: key("xWing", "remove"),
            technique: "xWing",
        },
        {
            kind: "pick",
            stage: "follow",
            board: X_WING_FOLLOW_BOARD,
            marks: { range: [...rowOf(3), ...rowOf(6)], noteDigit: 6, emphasized: [6], dimOthers: true },
            targets: X_WING_FOLLOW_CORNERS,
            promptKey: key("xWing", "pickPrompt"),
            successKey: key("xWing", "pickSuccess"),
            wrongKey: key("xWing", "pickWrong"),
            hints: [
                { textKey: key("xWing", "pickHintFirstRow"), marks: { lit: cells([3, 2], [3, 7]) } },
                { textKey: key("xWing", "pickHintSecondRow"), marks: { lit: X_WING_FOLLOW_CORNERS } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: X_WING_FOLLOW_BOARD,
            marks: {
                range: [...columnOf(2), ...columnOf(7)],
                pattern: X_WING_FOLLOW_CORNERS,
                noteDigit: 6,
                emphasized: [6],
                links: X_WING_FOLLOW_LINKS,
                dimOthers: true,
            },
            removals: [removal(9, 7, 6)],
            pattern: X_WING_FOLLOW_CORNERS,
            digits: [6],
            technique: "xWing",
            promptKey: key("xWing", "removePrompt"),
            successKey: key("xWing", "removeSuccess"),
            keepKey: key("xWing", "corner"),
            wrongKey: key("xWing", "removeWrong"),
            hints: [
                { textKey: key("xWing", "removeHintLook") },
                { textKey: key("xWing", "removeHintAnswer"), marks: { lit: [at(9, 7)] } },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: X_WING_ALONE_BOARD,
            marks: { noteDigit: 1 },
            removals: [removal(5, 6, 1)],
            pattern: X_WING_ALONE_CORNERS,
            digits: [1],
            technique: "xWing",
            promptKey: key("xWing", "alonePrompt"),
            successKey: key("xWing", "aloneSuccess"),
            keepKey: key("xWing", "corner"),
            wrongKey: key("xWing", "aloneWrong"),
            hints: [
                { textKey: key("xWing", "aloneHintColumns"), marks: { range: [...columnOf(3), ...columnOf(4)] } },
                { textKey: key("xWing", "aloneHintCorners"), marks: { pattern: X_WING_ALONE_CORNERS, emphasized: [1] } },
                { textKey: key("xWing", "aloneHintAnswer"), marks: { pattern: X_WING_ALONE_CORNERS, emphasized: [1], lit: [at(5, 6)] } },
            ],
        },
        { kind: "done", stage: "done", board: X_WING_SHOW_BOARD, marks: {}, takeawayKey: key("xWing", "takeaway") },
    ],
};

// Swordfish: rows 1, 3 and 6 hold the 9s in columns 1, 4 and 8
const SWORDFISH_SHOW_BOARD = board("032570801105308702874012503703800015501703084048051237387465129256139478419287356");
const SWORDFISH_SHOW_CELLS = cells([1, 1], [1, 8], [3, 4], [3, 8], [6, 1], [6, 4]);
const SWORDFISH_SHOW_ROWS = [...rowOf(1), ...rowOf(3), ...rowOf(6)];
const SWORDFISH_SHOW_COLUMNS = [...columnOf(1), ...columnOf(4), ...columnOf(8)];
const SWORDFISH_SHOW_ROW_LINKS = [link([1, 1], [1, 8], 9), link([3, 4], [3, 8], 9), link([6, 1], [6, 4], 9)];
const SWORDFISH_SHOW_LINKS = [
    ...SWORDFISH_SHOW_ROW_LINKS,
    link([1, 1], [6, 1], 9, "weak"),
    link([3, 4], [6, 4], 9, "weak"),
    link([1, 8], [3, 8], 9, "weak"),
];
const SWORDFISH_SHOW_MARKS = { pattern: SWORDFISH_SHOW_CELLS, noteDigit: 9, emphasized: [9], dimOthers: true };

// Jellyfish: rows 2, 3, 6 and 7 hold the 6s in columns 1, 3, 5 and 9
const JELLYFISH_SHOW_BOARD = board(
    "438510000591007340070934158805391004719450803043008591950103280300005010187629435",
    removal(1, 8, 2),
    removal(1, 9, 7),
    removal(8, 7, 7),
);

// Rows 3, 6 and 9 hold the 5s in columns 2, 3 and 6
const SWORDFISH_FOLLOW_BOARD = board("001036479379814256460970183196008347200067590700049620900601735017403962603790814", removal(6, 4, 5));
const SWORDFISH_FOLLOW_CELLS = cells([3, 3], [3, 6], [6, 2], [6, 3], [9, 2], [9, 6]);

// Rows 3, 6 and 9 hold the 4s in columns 2, 5 and 7
const SWORDFISH_ALONE_BOARD = board("010074362060002709700006018080007106174369825006008073007601084091085637608703001", removal(3, 5, 9), removal(6, 4, 4));
const SWORDFISH_ALONE_CELLS = cells([3, 2], [3, 7], [6, 5], [6, 7], [9, 2], [9, 5]);

export const FISH: Lesson = {
    id: "fish",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: SWORDFISH_SHOW_BOARD,
            marks: { ...SWORDFISH_SHOW_MARKS, range: SWORDFISH_SHOW_ROWS },
            textKey: key("fish", "threeRows"),
        },
        {
            kind: "show",
            stage: "explain",
            board: SWORDFISH_SHOW_BOARD,
            marks: { ...SWORDFISH_SHOW_MARKS, range: SWORDFISH_SHOW_COLUMNS, links: SWORDFISH_SHOW_ROW_LINKS },
            textKey: key("fish", "threeColumns"),
        },
        {
            kind: "show",
            stage: "explain",
            board: SWORDFISH_SHOW_BOARD,
            marks: { ...SWORDFISH_SHOW_MARKS, lit: cells([1, 1], [3, 8], [6, 4]), links: SWORDFISH_SHOW_LINKS },
            textKey: key("fish", "caseOne"),
        },
        {
            kind: "show",
            stage: "explain",
            board: SWORDFISH_SHOW_BOARD,
            marks: { ...SWORDFISH_SHOW_MARKS, lit: cells([1, 8], [3, 4], [6, 1]), links: SWORDFISH_SHOW_LINKS },
            textKey: key("fish", "caseTwo"),
        },
        {
            kind: "show",
            stage: "explain",
            board: SWORDFISH_SHOW_BOARD,
            marks: { ...SWORDFISH_SHOW_MARKS, range: SWORDFISH_SHOW_COLUMNS, links: SWORDFISH_SHOW_LINKS, eliminated: [removal(2, 8, 9)] },
            textKey: key("fish", "remove"),
            technique: "swordfish",
        },
        {
            kind: "show",
            stage: "explain",
            board: JELLYFISH_SHOW_BOARD,
            marks: {
                range: [...columnOf(1), ...columnOf(3), ...columnOf(5), ...columnOf(9)],
                pattern: cells([2, 5], [2, 9], [3, 1], [3, 3], [6, 1], [6, 5], [7, 3], [7, 9]),
                noteDigit: 6,
                emphasized: [6],
                dimOthers: true,
                links: [
                    link([2, 5], [2, 9], 6),
                    link([3, 1], [3, 3], 6),
                    link([6, 1], [6, 5], 6),
                    link([7, 3], [7, 9], 6),
                    link([3, 1], [6, 1], 6, "weak"),
                    link([3, 3], [7, 3], 6, "weak"),
                    link([2, 5], [6, 5], 6, "weak"),
                    link([2, 9], [7, 9], 6, "weak"),
                ],
                eliminated: [removal(8, 3, 6), removal(1, 9, 6), removal(8, 9, 6)],
            },
            textKey: key("fish", "jellyfish"),
            technique: "jellyfish",
        },
        {
            kind: "pick",
            stage: "follow",
            board: SWORDFISH_FOLLOW_BOARD,
            marks: { range: [...rowOf(3), ...rowOf(6), ...rowOf(9)], noteDigit: 5, emphasized: [5], dimOthers: true },
            targets: SWORDFISH_FOLLOW_CELLS,
            promptKey: key("fish", "pickPrompt"),
            successKey: key("fish", "pickSuccess"),
            wrongKey: key("fish", "pickWrong"),
            hints: [
                { textKey: key("fish", "pickHintFirstRow"), marks: { lit: cells([3, 3], [3, 6]) } },
                { textKey: key("fish", "pickHintOtherRows"), marks: { lit: SWORDFISH_FOLLOW_CELLS } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: SWORDFISH_FOLLOW_BOARD,
            marks: {
                range: [...columnOf(2), ...columnOf(3), ...columnOf(6)],
                pattern: SWORDFISH_FOLLOW_CELLS,
                noteDigit: 5,
                emphasized: [5],
                dimOthers: true,
                links: [
                    link([3, 3], [3, 6], 5),
                    link([6, 2], [6, 3], 5),
                    link([9, 2], [9, 6], 5),
                    link([3, 3], [6, 3], 5, "weak"),
                    link([6, 2], [9, 2], 5, "weak"),
                    link([3, 6], [9, 6], 5, "weak"),
                ],
            },
            removals: [removal(1, 2, 5)],
            pattern: SWORDFISH_FOLLOW_CELLS,
            digits: [5],
            technique: "swordfish",
            promptKey: key("fish", "removePrompt"),
            successKey: key("fish", "removeSuccess"),
            keepKey: key("fish", "keep"),
            wrongKey: key("fish", "removeWrong"),
            hints: [
                { textKey: key("fish", "removeHintLook") },
                { textKey: key("fish", "removeHintAnswer"), marks: { lit: [at(1, 2)] } },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: SWORDFISH_ALONE_BOARD,
            marks: { noteDigit: 4 },
            removals: [removal(4, 5, 4)],
            pattern: SWORDFISH_ALONE_CELLS,
            digits: [4],
            technique: "swordfish",
            promptKey: key("fish", "alonePrompt"),
            successKey: key("fish", "aloneSuccess"),
            keepKey: key("fish", "keep"),
            wrongKey: key("fish", "aloneWrong"),
            hints: [
                { textKey: key("fish", "aloneHintRows"), marks: { range: [...rowOf(3), ...rowOf(6), ...rowOf(9)] } },
                { textKey: key("fish", "aloneHintColumns"), marks: { pattern: SWORDFISH_ALONE_CELLS, emphasized: [4] } },
                { textKey: key("fish", "aloneHintAnswer"), marks: { pattern: SWORDFISH_ALONE_CELLS, emphasized: [4], lit: [at(4, 5)] } },
            ],
        },
        { kind: "done", stage: "done", board: SWORDFISH_SHOW_BOARD, marks: {}, takeawayKey: key("fish", "takeaway") },
    ],
};

// XY-Wing: the pivot at row 8, column 4 (5, 7) hands 3 to row 8, column 1 or to row 4, column 4
const XY_WING_SHOW_BOARD = board("259861437163247958748009621021005846405608712687412593006103284002084169814926375");
const XY_WING_SHOW_CELLS = cells([8, 4], [8, 1], [4, 4]);
const XY_WING_SHOW_LINKS = [link([8, 4], [8, 1], 5), link([8, 4], [4, 4], 7)];
const XY_WING_SHOW_MARKS = { pattern: XY_WING_SHOW_CELLS, links: XY_WING_SHOW_LINKS, emphasized: [3], dimOthers: true };

// The pivot at row 4, column 2 (5, 7) hands 4 to row 4, column 9 or to row 6, column 3
const XY_WING_FOLLOW_BOARD = board("863002419792431586541896723906108230200603971310029860429367158600915342135284697");
const XY_WING_FOLLOW_CELLS = cells([4, 2], [4, 9], [6, 3]);

// The pivot at row 8, column 1 (2, 5) hands 8 to row 8, column 4 or to row 7, column 2
const XY_WING_ALONE_BOARD = board("418539762973462815006187439842796153695341287731000694104970326067003940309604570");
const XY_WING_ALONE_CELLS = cells([8, 1], [8, 4], [7, 2]);
const XY_WING_ALONE_LINKS = [link([8, 1], [8, 4], 2), link([8, 1], [7, 2], 5)];

export const XY_WING: Lesson = {
    id: "xyWing",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: XY_WING_SHOW_BOARD,
            marks: { pattern: [at(8, 4)], dimOthers: true },
            textKey: key("xyWing", "pivot"),
        },
        { kind: "show", stage: "explain", board: XY_WING_SHOW_BOARD, marks: XY_WING_SHOW_MARKS, textKey: key("xyWing", "ends") },
        {
            kind: "show",
            stage: "explain",
            board: XY_WING_SHOW_BOARD,
            marks: { ...XY_WING_SHOW_MARKS, lit: cells([8, 4], [8, 1]) },
            textKey: key("xyWing", "caseOne"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XY_WING_SHOW_BOARD,
            marks: { ...XY_WING_SHOW_MARKS, lit: cells([8, 4], [4, 4]) },
            textKey: key("xyWing", "caseTwo"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XY_WING_SHOW_BOARD,
            marks: { ...XY_WING_SHOW_MARKS, range: [...rowOf(4), ...columnOf(1)], eliminated: [removal(4, 1, 3)] },
            textKey: key("xyWing", "remove"),
            technique: "xyWing",
        },
        {
            kind: "pick",
            stage: "follow",
            board: XY_WING_FOLLOW_BOARD,
            marks: { range: [...rowOf(4), ...boxOf(4)], dimOthers: true },
            targets: XY_WING_FOLLOW_CELLS,
            promptKey: key("xyWing", "pickPrompt"),
            successKey: key("xyWing", "pickSuccess"),
            wrongKey: key("xyWing", "pickWrong"),
            hints: [
                { textKey: key("xyWing", "pickHintRow"), marks: { range: rowOf(4) } },
                { textKey: key("xyWing", "pickHintBox"), marks: { range: boxOf(4) } },
                { textKey: key("xyWing", "pickHintAnswer"), marks: { lit: XY_WING_FOLLOW_CELLS } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: XY_WING_FOLLOW_BOARD,
            marks: {
                range: [...rowOf(6), ...columnOf(9)],
                pattern: XY_WING_FOLLOW_CELLS,
                links: [link([4, 2], [4, 9], 5), link([4, 2], [6, 3], 7)],
                emphasized: [4],
                dimOthers: true,
            },
            removals: [removal(6, 9, 4)],
            pattern: XY_WING_FOLLOW_CELLS,
            digits: [4],
            technique: "xyWing",
            promptKey: key("xyWing", "removePrompt"),
            successKey: key("xyWing", "removeSuccess"),
            keepKey: key("xyWing", "keep"),
            wrongKey: key("xyWing", "removeWrong"),
            hints: [
                { textKey: key("xyWing", "removeHintLines") },
                { textKey: key("xyWing", "removeHintAnswer"), marks: { lit: [at(6, 9)] } },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: XY_WING_ALONE_BOARD,
            marks: {},
            removals: [removal(7, 6, 8)],
            pattern: XY_WING_ALONE_CELLS,
            digits: [8],
            technique: "xyWing",
            promptKey: key("xyWing", "alonePrompt"),
            successKey: key("xyWing", "aloneSuccess"),
            keepKey: key("xyWing", "keep"),
            wrongKey: key("xyWing", "aloneWrong"),
            hints: [
                { textKey: key("xyWing", "aloneHintPivot"), marks: { pattern: [at(8, 1)] } },
                { textKey: key("xyWing", "aloneHintEnds"), marks: { pattern: XY_WING_ALONE_CELLS, links: XY_WING_ALONE_LINKS, emphasized: [8] } },
                { textKey: key("xyWing", "aloneHintAnswer"), marks: { pattern: XY_WING_ALONE_CELLS, links: XY_WING_ALONE_LINKS, emphasized: [8], lit: [at(7, 6)] } },
            ],
        },
        { kind: "done", stage: "done", board: XY_WING_SHOW_BOARD, marks: {}, takeawayKey: key("xyWing", "takeaway") },
    ],
};

// W-Wing: the 8s of row 9 join two 5-8 cells
const W_WING_SHOW_BOARD = board("648215379325479618917368254456792183091034062032601490584127936273906041169043020");
const W_WING_SHOW_ENDS = cells([5, 4], [8, 7]);
const W_WING_SHOW_LINK_CELLS = cells([9, 4], [9, 7]);
const W_WING_SHOW_ROW_LINK = link([9, 4], [9, 7], 8);
const W_WING_SHOW_LINKS = [link([5, 4], [9, 4], 8, "weak"), W_WING_SHOW_ROW_LINK, link([9, 7], [8, 7], 8, "weak")];
const W_WING_SHOW_MARKS = { pattern: W_WING_SHOW_ENDS, targets: W_WING_SHOW_LINK_CELLS, emphasized: [5], dimOthers: true };

// The 2s of row 5 join two 2-5 cells
const W_WING_FOLLOW_BOARD = board("569738124814962573237415869740309018180047390392186457478601930603094781901873040");
const W_WING_FOLLOW_ENDS = cells([4, 5], [7, 9]);
const W_WING_FOLLOW_LINK_CELLS = cells([5, 4], [5, 9]);

// The 3s of column 8 join two 3-6 cells
const W_WING_ALONE_BOARD = board("824671395010945782795238400047569820589123647002784509970452108401897250258316974");
const W_WING_ALONE_ENDS = cells([6, 2], [7, 3]);
const W_WING_ALONE_LINK_CELLS = cells([6, 8], [7, 8]);
const W_WING_ALONE_LINKS = [link([6, 2], [6, 8], 3, "weak"), link([6, 8], [7, 8], 3), link([7, 8], [7, 3], 3, "weak")];

export const W_WING: Lesson = {
    id: "wWing",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: W_WING_SHOW_BOARD,
            marks: { pattern: W_WING_SHOW_ENDS, emphasized: [5], dimOthers: true },
            textKey: key("wWing", "pair"),
        },
        {
            kind: "show",
            stage: "explain",
            board: W_WING_SHOW_BOARD,
            marks: { ...W_WING_SHOW_MARKS, range: rowOf(9), links: [W_WING_SHOW_ROW_LINK] },
            textKey: key("wWing", "linkRow"),
        },
        {
            kind: "show",
            stage: "explain",
            board: W_WING_SHOW_BOARD,
            marks: { ...W_WING_SHOW_MARKS, lit: cells([9, 4], [5, 4]), links: W_WING_SHOW_LINKS },
            textKey: key("wWing", "caseOne"),
        },
        {
            kind: "show",
            stage: "explain",
            board: W_WING_SHOW_BOARD,
            marks: { ...W_WING_SHOW_MARKS, lit: cells([9, 7], [8, 7]), links: W_WING_SHOW_LINKS },
            textKey: key("wWing", "caseTwo"),
        },
        {
            kind: "show",
            stage: "explain",
            board: W_WING_SHOW_BOARD,
            marks: { ...W_WING_SHOW_MARKS, range: [...rowOf(5), ...columnOf(7)], links: W_WING_SHOW_LINKS, eliminated: [removal(5, 7, 5)] },
            textKey: key("wWing", "remove"),
            technique: "wWing",
        },
        {
            kind: "pick",
            stage: "follow",
            board: W_WING_FOLLOW_BOARD,
            marks: { range: [...rowOf(5), ...W_WING_FOLLOW_ENDS], dimOthers: true },
            targets: [...W_WING_FOLLOW_ENDS, ...W_WING_FOLLOW_LINK_CELLS],
            promptKey: key("wWing", "pickPrompt"),
            successKey: key("wWing", "pickSuccess"),
            wrongKey: key("wWing", "pickWrong"),
            hints: [
                { textKey: key("wWing", "pickHintRow"), marks: { lit: W_WING_FOLLOW_LINK_CELLS } },
                { textKey: key("wWing", "pickHintEnds"), marks: { lit: [...W_WING_FOLLOW_ENDS, ...W_WING_FOLLOW_LINK_CELLS] } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: W_WING_FOLLOW_BOARD,
            marks: {
                range: [...columnOf(5), ...rowOf(7)],
                pattern: W_WING_FOLLOW_ENDS,
                targets: W_WING_FOLLOW_LINK_CELLS,
                links: [link([4, 5], [5, 4], 2, "weak"), link([5, 4], [5, 9], 2), link([5, 9], [7, 9], 2, "weak")],
                emphasized: [5],
                dimOthers: true,
            },
            removals: [removal(7, 5, 5)],
            pattern: W_WING_FOLLOW_ENDS,
            digits: [5],
            technique: "wWing",
            promptKey: key("wWing", "removePrompt"),
            successKey: key("wWing", "removeSuccess"),
            keepKey: key("wWing", "keep"),
            wrongKey: key("wWing", "removeWrong"),
            hints: [
                { textKey: key("wWing", "removeHintLines") },
                { textKey: key("wWing", "removeHintAnswer"), marks: { lit: [at(7, 5)] } },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: W_WING_ALONE_BOARD,
            marks: {},
            removals: [removal(8, 2, 6)],
            pattern: W_WING_ALONE_ENDS,
            digits: [6],
            technique: "wWing",
            promptKey: key("wWing", "alonePrompt"),
            successKey: key("wWing", "aloneSuccess"),
            keepKey: key("wWing", "keep"),
            wrongKey: key("wWing", "aloneWrong"),
            hints: [
                { textKey: key("wWing", "aloneHintEnds"), marks: { pattern: W_WING_ALONE_ENDS, emphasized: [6] } },
                { textKey: key("wWing", "aloneHintColumn"), marks: { range: columnOf(8), pattern: W_WING_ALONE_ENDS, targets: W_WING_ALONE_LINK_CELLS, links: W_WING_ALONE_LINKS, emphasized: [6] } },
                { textKey: key("wWing", "aloneHintAnswer"), marks: { pattern: W_WING_ALONE_ENDS, targets: W_WING_ALONE_LINK_CELLS, links: W_WING_ALONE_LINKS, emphasized: [6], lit: [at(8, 2)] } },
            ],
        },
        { kind: "done", stage: "done", board: W_WING_SHOW_BOARD, marks: {}, takeawayKey: key("wWing", "takeaway") },
    ],
};

// XYZ-Wing: the pivot at row 7, column 1 (3, 5, 9), with 3 shared by all three cells
const XYZ_WING_SHOW_BOARD = board("798324516123856749645791382259138467007642951400579238000487600000963100000215800");
const XYZ_WING_SHOW_CELLS = cells([7, 1], [7, 9], [9, 1]);
const XYZ_WING_SHOW_LINKS = [link([7, 1], [7, 9], 5), link([7, 1], [9, 1], 9)];
const XYZ_WING_SHOW_MARKS = { pattern: XYZ_WING_SHOW_CELLS, links: XYZ_WING_SHOW_LINKS, emphasized: [3], dimOthers: true };

// WXYZ-Wing: the pivot at row 3, column 1 (6, 7, 8, 9), with 6 shared by all four cells
const WXYZ_WING_SHOW_BOARD = board("010403709340789001000510340053107490420950137179340000001805924080204613204601875");

// The pivot at row 4, column 4 (4, 6, 7), with 6 shared
const XYZ_WING_FOLLOW_BOARD = board("618943257395827614742000398200000130903001420150002870421569783839274561567008942");
const XYZ_WING_FOLLOW_CELLS = cells([4, 4], [4, 3], [5, 4]);

// The pivot at row 8, column 6 (2, 4, 5), with 2 shared
const XYZ_WING_ALONE_BOARD = board("489001756615987234732060981940108507250749010178650490894016370367090100521070009");
const XYZ_WING_ALONE_CELLS = cells([8, 6], [7, 4], [8, 8]);
const XYZ_WING_ALONE_LINKS = [link([8, 6], [7, 4], 5), link([8, 6], [8, 8], 4)];

export const XYZ_WING: Lesson = {
    id: "xyzWing",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: XYZ_WING_SHOW_BOARD,
            marks: { pattern: [at(7, 1)], dimOthers: true },
            textKey: key("xyzWing", "pivot"),
        },
        { kind: "show", stage: "explain", board: XYZ_WING_SHOW_BOARD, marks: XYZ_WING_SHOW_MARKS, textKey: key("xyzWing", "ends") },
        {
            kind: "show",
            stage: "explain",
            board: XYZ_WING_SHOW_BOARD,
            marks: { ...XYZ_WING_SHOW_MARKS, lit: cells([7, 9], [9, 1]) },
            textKey: key("xyzWing", "casesEnds"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XYZ_WING_SHOW_BOARD,
            marks: { ...XYZ_WING_SHOW_MARKS, lit: [at(7, 1)] },
            textKey: key("xyzWing", "casePivot"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XYZ_WING_SHOW_BOARD,
            marks: { ...XYZ_WING_SHOW_MARKS, range: [...rowOf(7), ...boxOf(7)], eliminated: [removal(7, 2, 3)] },
            textKey: key("xyzWing", "remove"),
            technique: "xyzWing",
        },
        {
            kind: "show",
            stage: "explain",
            board: WXYZ_WING_SHOW_BOARD,
            marks: {
                range: [...boxOf(1), ...columnOf(1)],
                pattern: cells([3, 1], [3, 2], [4, 1], [7, 1]),
                links: [link([3, 1], [3, 2], 9), link([3, 1], [4, 1], 8), link([3, 1], [7, 1], 7)],
                emphasized: [6],
                dimOthers: true,
                eliminated: [removal(1, 1, 6)],
            },
            textKey: key("xyzWing", "wxyz"),
            technique: "wxyzWing",
        },
        {
            kind: "pick",
            stage: "follow",
            board: XYZ_WING_FOLLOW_BOARD,
            marks: { range: [...rowOf(4), ...boxOf(5)], dimOthers: true },
            targets: XYZ_WING_FOLLOW_CELLS,
            promptKey: key("xyzWing", "pickPrompt"),
            successKey: key("xyzWing", "pickSuccess"),
            wrongKey: key("xyzWing", "pickWrong"),
            hints: [
                { textKey: key("xyzWing", "pickHintRow"), marks: { range: rowOf(4) } },
                { textKey: key("xyzWing", "pickHintBox"), marks: { range: boxOf(5) } },
                { textKey: key("xyzWing", "pickHintAnswer"), marks: { lit: XYZ_WING_FOLLOW_CELLS } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: XYZ_WING_FOLLOW_BOARD,
            marks: {
                range: [...rowOf(4), ...boxOf(5)],
                pattern: XYZ_WING_FOLLOW_CELLS,
                links: [link([4, 4], [4, 3], 4), link([4, 4], [5, 4], 7)],
                emphasized: [6],
                dimOthers: true,
            },
            removals: [removal(4, 6, 6)],
            pattern: XYZ_WING_FOLLOW_CELLS,
            digits: [6],
            technique: "xyzWing",
            promptKey: key("xyzWing", "removePrompt"),
            successKey: key("xyzWing", "removeSuccess"),
            keepKey: key("xyzWing", "keep"),
            wrongKey: key("xyzWing", "removeWrong"),
            hints: [
                { textKey: key("xyzWing", "removeHintLines") },
                { textKey: key("xyzWing", "removeHintAnswer"), marks: { lit: [at(4, 6)] } },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: XYZ_WING_ALONE_BOARD,
            marks: {},
            removals: [removal(8, 4, 2)],
            pattern: XYZ_WING_ALONE_CELLS,
            digits: [2],
            technique: "xyzWing",
            promptKey: key("xyzWing", "alonePrompt"),
            successKey: key("xyzWing", "aloneSuccess"),
            keepKey: key("xyzWing", "keep"),
            wrongKey: key("xyzWing", "aloneWrong"),
            hints: [
                { textKey: key("xyzWing", "aloneHintPivot"), marks: { pattern: [at(8, 6)] } },
                { textKey: key("xyzWing", "aloneHintEnds"), marks: { pattern: XYZ_WING_ALONE_CELLS, links: XYZ_WING_ALONE_LINKS, emphasized: [2] } },
                { textKey: key("xyzWing", "aloneHintAnswer"), marks: { pattern: XYZ_WING_ALONE_CELLS, links: XYZ_WING_ALONE_LINKS, emphasized: [2], lit: [at(8, 4)] } },
            ],
        },
        { kind: "done", stage: "done", board: XYZ_WING_SHOW_BOARD, marks: {}, takeawayKey: key("xyzWing", "takeaway") },
    ],
};

// X-Chain: the 7s of row 1 and of column 8, joined in box 3
const X_CHAIN_SHOW_BOARD = board("541390060620541300930026541179652834264030105853014026495283617316475080782169453");
const X_CHAIN_SHOW_CELLS = cells([1, 6], [1, 7], [2, 8], [5, 8]);
const X_CHAIN_SHOW_LINKS = [link([1, 6], [1, 7], 7), link([1, 7], [2, 8], 7, "weak"), link([2, 8], [5, 8], 7)];
const X_CHAIN_SHOW_MARKS = { noteDigit: 7, emphasized: [7], dimOthers: true };

// The 2s of row 1 and of column 2, joined in box 1
const X_CHAIN_FOLLOW_BOARD = board("780140653401035978300070241173564829096017435004390167038401796910706384647983512");
const X_CHAIN_FOLLOW_CELLS = cells([1, 6], [1, 3], [2, 2], [6, 2]);

// The 3s of row 1 and of column 7, joined in box 3. Other short chains remove other 3s here, so the prompt names row 4.
const X_CHAIN_ALONE_BOARD = board("409506870705040096638719542941600050287051960563097200352964000894173625176285439");
const X_CHAIN_ALONE_CELLS = cells([1, 5], [1, 9], [2, 7], [4, 7]);
const X_CHAIN_ALONE_LINKS = [link([1, 5], [1, 9], 3), link([1, 9], [2, 7], 3, "weak"), link([2, 7], [4, 7], 3)];

export const X_CHAIN: Lesson = {
    id: "xChain",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: X_CHAIN_SHOW_BOARD,
            marks: { ...X_CHAIN_SHOW_MARKS, range: rowOf(1), pattern: cells([1, 6], [1, 7]), links: [X_CHAIN_SHOW_LINKS[0]] },
            textKey: key("xChain", "strongRow"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_CHAIN_SHOW_BOARD,
            marks: { ...X_CHAIN_SHOW_MARKS, range: [...rowOf(1), ...columnOf(8)], pattern: X_CHAIN_SHOW_CELLS, links: [X_CHAIN_SHOW_LINKS[0], X_CHAIN_SHOW_LINKS[2]] },
            textKey: key("xChain", "strongColumn"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_CHAIN_SHOW_BOARD,
            marks: { ...X_CHAIN_SHOW_MARKS, range: boxOf(3), pattern: X_CHAIN_SHOW_CELLS, links: X_CHAIN_SHOW_LINKS },
            textKey: key("xChain", "weak"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_CHAIN_SHOW_BOARD,
            marks: { ...X_CHAIN_SHOW_MARKS, pattern: X_CHAIN_SHOW_CELLS, lit: cells([1, 7], [5, 8]), links: X_CHAIN_SHOW_LINKS },
            textKey: key("xChain", "follow"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_CHAIN_SHOW_BOARD,
            marks: { ...X_CHAIN_SHOW_MARKS, pattern: X_CHAIN_SHOW_CELLS, lit: cells([1, 6], [5, 8]), links: X_CHAIN_SHOW_LINKS },
            textKey: key("xChain", "ends"),
        },
        {
            kind: "show",
            stage: "explain",
            board: X_CHAIN_SHOW_BOARD,
            marks: { ...X_CHAIN_SHOW_MARKS, range: [...rowOf(5), ...columnOf(6)], pattern: X_CHAIN_SHOW_CELLS, links: X_CHAIN_SHOW_LINKS, eliminated: [removal(5, 6, 7)] },
            textKey: key("xChain", "remove"),
            technique: "xChain",
        },
        {
            kind: "pick",
            stage: "follow",
            board: X_CHAIN_FOLLOW_BOARD,
            marks: { range: [...rowOf(1), ...columnOf(2)], noteDigit: 2, emphasized: [2], dimOthers: true },
            targets: X_CHAIN_FOLLOW_CELLS,
            promptKey: key("xChain", "pickPrompt"),
            successKey: key("xChain", "pickSuccess"),
            wrongKey: key("xChain", "pickWrong"),
            hints: [
                { textKey: key("xChain", "pickHintRow"), marks: { lit: cells([1, 3], [1, 6]) } },
                { textKey: key("xChain", "pickHintColumn"), marks: { lit: X_CHAIN_FOLLOW_CELLS } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: X_CHAIN_FOLLOW_BOARD,
            marks: {
                range: [...columnOf(6), ...rowOf(6)],
                pattern: X_CHAIN_FOLLOW_CELLS,
                noteDigit: 2,
                emphasized: [2],
                links: [link([1, 6], [1, 3], 2), link([1, 3], [2, 2], 2, "weak"), link([2, 2], [6, 2], 2)],
                dimOthers: true,
            },
            removals: [removal(6, 6, 2)],
            pattern: X_CHAIN_FOLLOW_CELLS,
            digits: [2],
            technique: "xChain",
            promptKey: key("xChain", "removePrompt"),
            successKey: key("xChain", "removeSuccess"),
            keepKey: key("xChain", "keep"),
            wrongKey: key("xChain", "removeWrong"),
            hints: [
                { textKey: key("xChain", "removeHintLines") },
                { textKey: key("xChain", "removeHintAnswer"), marks: { lit: [at(6, 6)] } },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: X_CHAIN_ALONE_BOARD,
            marks: { range: rowOf(4), noteDigit: 3 },
            removals: [removal(4, 5, 3)],
            pattern: X_CHAIN_ALONE_CELLS,
            digits: [3],
            technique: "xChain",
            promptKey: key("xChain", "alonePrompt"),
            successKey: key("xChain", "aloneSuccess"),
            keepKey: key("xChain", "keep"),
            wrongKey: key("xChain", "aloneWrong"),
            hints: [
                { textKey: key("xChain", "aloneHintLines"), marks: { range: [...rowOf(1), ...columnOf(7)] } },
                { textKey: key("xChain", "aloneHintBox"), marks: { pattern: X_CHAIN_ALONE_CELLS, links: X_CHAIN_ALONE_LINKS, emphasized: [3] } },
                { textKey: key("xChain", "aloneHintAnswer"), marks: { pattern: X_CHAIN_ALONE_CELLS, links: X_CHAIN_ALONE_LINKS, emphasized: [3], lit: [at(4, 5)] } },
            ],
        },
        { kind: "done", stage: "done", board: X_CHAIN_SHOW_BOARD, marks: {}, takeawayKey: key("xChain", "takeaway") },
    ],
};

// XY-Chain: six two-candidate cells, from row 2, column 5 to row 7, column 1, with 9 at both ends
const XY_CHAIN_SHOW_BOARD = board("469182753731504028825370140174635080392748010586921437018407360657213894043800071");
const XY_CHAIN_SHOW_CELLS = cells([2, 5], [2, 7], [3, 9], [5, 9], [7, 9], [7, 1]);
const XY_CHAIN_SHOW_LINKS = [
    link([2, 5], [2, 7], 6),
    link([2, 7], [3, 9], 9),
    link([3, 9], [5, 9], 6),
    link([5, 9], [7, 9], 5),
    link([7, 9], [7, 1], 2),
];
const XY_CHAIN_SHOW_MARKS = { pattern: XY_CHAIN_SHOW_CELLS, dimOthers: true };

// Four cells, from row 4, column 1 to row 5, column 8, with 7 at both ends
const XY_CHAIN_FOLLOW_BOARD = board("278100634435826719916437285092301400301600900004902351147268593009713840803500107", removal(4, 1, 6));
const XY_CHAIN_FOLLOW_CELLS = cells([4, 1], [5, 2], [5, 9], [5, 8]);

// Five cells, from row 4, column 1 to row 5, column 8, with 1 at both ends: the only chain that removes a 1 here
const XY_CHAIN_ALONE_BOARD = board("246080937985376124731492568050769002670000009090000756429853671813627495567914283");
const XY_CHAIN_ALONE_CELLS = cells([4, 1], [4, 7], [5, 7], [5, 5], [5, 8]);
const XY_CHAIN_ALONE_LINKS = [link([4, 1], [4, 7], 3), link([4, 7], [5, 7], 8), link([5, 7], [5, 5], 3), link([5, 5], [5, 8], 4)];

export const XY_CHAIN: Lesson = {
    id: "xyChain",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: XY_CHAIN_SHOW_BOARD,
            marks: { ...XY_CHAIN_SHOW_MARKS, links: XY_CHAIN_SHOW_LINKS },
            textKey: key("xyChain", "cells"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XY_CHAIN_SHOW_BOARD,
            marks: { ...XY_CHAIN_SHOW_MARKS, lit: cells([2, 5], [2, 7]), links: XY_CHAIN_SHOW_LINKS.slice(0, 1) },
            textKey: key("xyChain", "start"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XY_CHAIN_SHOW_BOARD,
            marks: { ...XY_CHAIN_SHOW_MARKS, lit: cells([3, 9], [5, 9], [7, 9]), links: XY_CHAIN_SHOW_LINKS.slice(0, 4) },
            textKey: key("xyChain", "middle"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XY_CHAIN_SHOW_BOARD,
            marks: { ...XY_CHAIN_SHOW_MARKS, lit: [at(7, 1)], links: XY_CHAIN_SHOW_LINKS },
            textKey: key("xyChain", "last"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XY_CHAIN_SHOW_BOARD,
            marks: { ...XY_CHAIN_SHOW_MARKS, lit: cells([2, 5], [7, 1]), links: XY_CHAIN_SHOW_LINKS, emphasized: [9] },
            textKey: key("xyChain", "ends"),
        },
        {
            kind: "show",
            stage: "explain",
            board: XY_CHAIN_SHOW_BOARD,
            marks: { ...XY_CHAIN_SHOW_MARKS, range: [...columnOf(5), ...rowOf(7)], links: XY_CHAIN_SHOW_LINKS, emphasized: [9], eliminated: [removal(7, 5, 9)] },
            textKey: key("xyChain", "remove"),
            technique: "xyChain",
        },
        {
            kind: "pick",
            stage: "follow",
            board: XY_CHAIN_FOLLOW_BOARD,
            marks: { range: [...rowOf(5), at(4, 1)], dimOthers: true },
            targets: XY_CHAIN_FOLLOW_CELLS,
            promptKey: key("xyChain", "pickPrompt"),
            successKey: key("xyChain", "pickSuccess"),
            wrongKey: key("xyChain", "pickWrong"),
            hints: [
                { textKey: key("xyChain", "pickHintStart"), marks: { lit: cells([4, 1], [5, 2]) } },
                { textKey: key("xyChain", "pickHintRest"), marks: { lit: XY_CHAIN_FOLLOW_CELLS } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: XY_CHAIN_FOLLOW_BOARD,
            marks: {
                range: [...rowOf(4), ...columnOf(8)],
                pattern: XY_CHAIN_FOLLOW_CELLS,
                links: [link([4, 1], [5, 2], 5), link([5, 2], [5, 9], 8), link([5, 9], [5, 8], 2)],
                emphasized: [7],
                dimOthers: true,
            },
            removals: [removal(4, 8, 7)],
            pattern: XY_CHAIN_FOLLOW_CELLS,
            digits: [7],
            technique: "xyChain",
            promptKey: key("xyChain", "removePrompt"),
            successKey: key("xyChain", "removeSuccess"),
            keepKey: key("xyChain", "keep"),
            wrongKey: key("xyChain", "removeWrong"),
            hints: [
                { textKey: key("xyChain", "removeHintLines") },
                { textKey: key("xyChain", "removeHintAnswer"), marks: { lit: [at(4, 8)] } },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: XY_CHAIN_ALONE_BOARD,
            marks: {},
            removals: [removal(4, 8, 1)],
            pattern: XY_CHAIN_ALONE_CELLS,
            digits: [1],
            technique: "xyChain",
            promptKey: key("xyChain", "alonePrompt"),
            successKey: key("xyChain", "aloneSuccess"),
            keepKey: key("xyChain", "keep"),
            wrongKey: key("xyChain", "aloneWrong"),
            hints: [
                { textKey: key("xyChain", "aloneHintStart"), marks: { pattern: [at(4, 1)], emphasized: [1] } },
                { textKey: key("xyChain", "aloneHintPath"), marks: { pattern: XY_CHAIN_ALONE_CELLS, links: XY_CHAIN_ALONE_LINKS, emphasized: [1] } },
                { textKey: key("xyChain", "aloneHintAnswer"), marks: { pattern: XY_CHAIN_ALONE_CELLS, links: XY_CHAIN_ALONE_LINKS, emphasized: [1], lit: [at(4, 8)] } },
            ],
        },
        { kind: "done", stage: "done", board: XY_CHAIN_SHOW_BOARD, marks: {}, takeawayKey: key("xyChain", "takeaway") },
    ],
};

export const HARD_LESSONS: Record<"xWing" | "fish" | "xyWing" | "wWing" | "xyzWing" | "xChain" | "xyChain", Lesson> = {
    xWing: X_WING,
    fish: FISH,
    xyWing: XY_WING,
    wWing: W_WING,
    xyzWing: XYZ_WING,
    xChain: X_CHAIN,
    xyChain: XY_CHAIN,
};
