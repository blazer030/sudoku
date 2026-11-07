import { at, boxOf, cells, columnOf, rowOf } from "@/domain/lessons/content/helpers";
import type { Lesson, LessonBoard } from "@/domain/lessons/Lesson";

const key = (lesson: string, name: string) => `lessons.content.${lesson}.${name}`;

/*
 . . .  2 6 .  7 . 1
 6 8 .  . 7 .  . 9 .
 1 9 .  . . 4  5 . .
 8 2 .  1 . .  . 4 .
 . . 4  6 . 2  9 . .
 . 5 .  . . 3  . 2 8
 . . 9  3 . .  . 7 4
 . 4 .  . 5 .  . 3 6
 7 . 3  . 1 8  . . .
*/
const EASY_BOARD: LessonBoard = {
    values: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    showsCandidates: false,
};

// The same puzzle's answer, three cells short
const RULES_BOARD: LessonBoard = {
    values: "035269781682571493197834562826195347374602915951743628519326874248957136763418250",
    showsCandidates: false,
};

export const RULES: Lesson = {
    id: "rules",
    steps: [
        { kind: "show", stage: "explain", board: RULES_BOARD, marks: { range: rowOf(5), dimOthers: true }, textKey: key("rules", "row") },
        { kind: "show", stage: "explain", board: RULES_BOARD, marks: { range: columnOf(5), dimOthers: true }, textKey: key("rules", "column") },
        { kind: "show", stage: "explain", board: RULES_BOARD, marks: { range: boxOf(5), dimOthers: true }, textKey: key("rules", "box") },
        {
            kind: "fill",
            stage: "follow",
            board: RULES_BOARD,
            marks: {},
            rule: "nakedSingle",
            required: 3,
            promptKey: key("rules", "fillPrompt"),
            successKey: key("rules", "fillSuccess"),
            hints: [],
        },
        { kind: "done", stage: "done", board: RULES_BOARD, marks: {}, takeawayKey: key("rules", "takeaway") },
    ],
};

export const FILLING_IN: Lesson = {
    id: "fillingIn",
    steps: [
        { kind: "show", stage: "explain", board: EASY_BOARD, marks: { lit: [at(3, 4)] }, textKey: key("fillingIn", "fill") },
        {
            kind: "fill",
            stage: "follow",
            board: EASY_BOARD,
            marks: { range: [at(3, 4)] },
            rule: "answer",
            required: 1,
            area: [at(3, 4)],
            areaKey: key("fillingIn", "fillArea"),
            promptKey: key("fillingIn", "fillPrompt"),
            successKey: key("fillingIn", "fillSuccess"),
            hints: [],
        },
        { kind: "show", stage: "explain", board: EASY_BOARD, marks: { lit: [at(3, 3)] }, textKey: key("fillingIn", "notes") },
        {
            kind: "note",
            stage: "follow",
            board: EASY_BOARD,
            marks: { range: [at(3, 3)] },
            cell: at(3, 3),
            digits: [2, 7],
            promptKey: key("fillingIn", "notePrompt"),
            successKey: key("fillingIn", "noteSuccess"),
            hints: [
                { textKey: key("fillingIn", "noteHintToggle") },
                { textKey: key("fillingIn", "noteHintCell"), marks: { lit: [at(3, 3)] } },
            ],
        },
        { kind: "show", stage: "explain", board: { ...EASY_BOARD, showsCandidates: true }, marks: {}, textKey: key("fillingIn", "autoNotes") },
        { kind: "done", stage: "done", board: EASY_BOARD, marks: {}, takeawayKey: key("fillingIn", "takeaway") },
    ],
};

const SEVENS_OF_BOX_ONE = { keepDigit: 7, dimOthers: true };

export const HIDDEN_SINGLE: Lesson = {
    id: "hiddenSingle",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: EASY_BOARD,
            marks: { ...SEVENS_OF_BOX_ONE, range: boxOf(1) },
            textKey: key("hiddenSingle", "lookAtBox"),
        },
        {
            kind: "show",
            stage: "explain",
            board: EASY_BOARD,
            marks: {
                ...SEVENS_OF_BOX_ONE,
                range: [...boxOf(1), ...rowOf(1)],
                targets: [at(1, 7)],
                crossed: cells([1, 1], [1, 2], [1, 3]),
            },
            textKey: key("hiddenSingle", "firstRow"),
        },
        {
            kind: "show",
            stage: "explain",
            board: EASY_BOARD,
            marks: {
                ...SEVENS_OF_BOX_ONE,
                range: [...boxOf(1), ...rowOf(2)],
                targets: cells([1, 7], [2, 5]),
                crossed: cells([1, 1], [1, 2], [1, 3], [2, 3]),
            },
            textKey: key("hiddenSingle", "secondRow"),
        },
        {
            kind: "show",
            stage: "explain",
            board: EASY_BOARD,
            marks: {
                ...SEVENS_OF_BOX_ONE,
                range: boxOf(1),
                targets: cells([1, 7], [2, 5]),
                crossed: cells([1, 1], [1, 2], [1, 3], [2, 3]),
                answers: [{ cell: at(3, 3), digit: 7 }],
            },
            textKey: key("hiddenSingle", "onlyCell"),
        },
        {
            kind: "show",
            stage: "explain",
            board: EASY_BOARD,
            marks: { targets: cells([1, 7], [2, 5], [7, 8], [9, 1]) },
            textKey: key("hiddenSingle", "tapToLight"),
        },
        {
            kind: "light",
            stage: "follow",
            board: EASY_BOARD,
            marks: {},
            digit: 3,
            answer: at(7, 4),
            wrongKey: key("hiddenSingle", "lightWrong"),
            promptKey: key("hiddenSingle", "lightPrompt"),
            successKey: key("hiddenSingle", "lightSuccess"),
            hints: [
                { textKey: key("hiddenSingle", "lightHintColumn"), marks: { range: columnOf(4) } },
                { textKey: key("hiddenSingle", "lightHintAnswer"), marks: { lit: [at(7, 4)] } },
            ],
        },
        {
            kind: "place",
            stage: "follow",
            board: EASY_BOARD,
            marks: {
                range: boxOf(2),
                targets: cells([6, 6], [7, 4], [8, 8], [9, 3]),
                keepDigit: 3,
                dimOthers: true,
            },
            digit: 3,
            answer: at(3, 5),
            range: boxOf(2),
            holdsDigit: true,
            promptKey: key("hiddenSingle", "followPrompt"),
            successKey: key("hiddenSingle", "followSuccess"),
            hints: [
                { textKey: key("hiddenSingle", "followHintColumns"), marks: { range: [...columnOf(4), ...columnOf(6)] } },
                { textKey: key("hiddenSingle", "followHintCrossed"), marks: { crossed: cells([1, 6], [2, 4], [2, 6], [3, 4]) } },
                { textKey: key("hiddenSingle", "followHintAnswer"), marks: { lit: [at(3, 5)] } },
            ],
        },
        {
            kind: "place",
            stage: "alone",
            board: EASY_BOARD,
            marks: {},
            digit: 5,
            answer: at(7, 1),
            acceptsAnyHiddenSingle: true,
            notYetKey: key("hiddenSingle", "aloneNotYet"),
            promptKey: key("hiddenSingle", "alonePrompt"),
            successKey: key("hiddenSingle", "aloneSuccess"),
            hints: [
                { textKey: key("hiddenSingle", "aloneHintBox"), marks: { range: boxOf(7) } },
                { textKey: key("hiddenSingle", "aloneHintDigit"), marks: { range: boxOf(7), keepDigit: 5, dimOthers: true } },
                { textKey: key("hiddenSingle", "aloneHintAnswer"), marks: { lit: [at(7, 1)] } },
            ],
        },
        { kind: "done", stage: "done", board: EASY_BOARD, marks: {}, takeawayKey: key("hiddenSingle", "takeaway") },
    ],
};

const HOUSES_OF_THE_CELL = [...rowOf(4), ...columnOf(5), ...boxOf(5)];

export const NAKED_SINGLE: Lesson = {
    id: "nakedSingle",
    steps: [
        { kind: "show", stage: "explain", board: EASY_BOARD, marks: { lit: [at(4, 5)], dimOthers: true }, textKey: key("nakedSingle", "lookAtCell") },
        { kind: "show", stage: "explain", board: EASY_BOARD, marks: { lit: [at(4, 5)], range: rowOf(4), dimOthers: true }, textKey: key("nakedSingle", "row") },
        { kind: "show", stage: "explain", board: EASY_BOARD, marks: { lit: [at(4, 5)], range: [...rowOf(4), ...columnOf(5)], dimOthers: true }, textKey: key("nakedSingle", "column") },
        { kind: "show", stage: "explain", board: EASY_BOARD, marks: { lit: [at(4, 5)], range: HOUSES_OF_THE_CELL, dimOthers: true }, textKey: key("nakedSingle", "box") },
        { kind: "show", stage: "explain", board: EASY_BOARD, marks: { answers: [{ cell: at(4, 5), digit: 9 }], range: HOUSES_OF_THE_CELL, dimOthers: true }, textKey: key("nakedSingle", "onlyDigit") },
        {
            kind: "fill",
            stage: "follow",
            board: EASY_BOARD,
            marks: { range: [at(3, 4)] },
            rule: "nakedSingle",
            required: 1,
            area: [at(3, 4)],
            areaKey: key("nakedSingle", "followArea"),
            promptKey: key("nakedSingle", "followPrompt"),
            successKey: key("nakedSingle", "followSuccess"),
            hints: [],
        },
        {
            kind: "fill",
            stage: "alone",
            board: EASY_BOARD,
            marks: {},
            rule: "nakedSingle",
            required: 1,
            area: rowOf(8),
            areaKey: key("nakedSingle", "aloneArea"),
            notYetKey: key("nakedSingle", "aloneNotYet"),
            promptKey: key("nakedSingle", "alonePrompt"),
            successKey: key("nakedSingle", "aloneSuccess"),
            hints: [],
        },
        { kind: "done", stage: "done", board: EASY_BOARD, marks: {}, takeawayKey: key("nakedSingle", "takeaway") },
    ],
};
