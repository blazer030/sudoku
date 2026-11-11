import { at, boxOf, cells, columnOf, removal, rowOf } from "@/domain/lessons/content/helpers";
import type { Lesson, LessonBoard } from "@/domain/lessons/Lesson";

const key = (lesson: string, name: string) => `lessons.content.${lesson}.${name}`;

const POINTING_SHOW_BOARD: LessonBoard = {
    values: "508469700400083956690025480105874690946352178870916504784531269369247815251698347",
    showsCandidates: true,
};
const POINTING_FOLLOW_BOARD: LessonBoard = {
    values: "390287406427156893608493700962845137004372968873961004036718049089534670740629380",
    showsCandidates: true,
};
const POINTING_ALONE_BOARD: LessonBoard = {
    values: "296431587834200691175896324048029106019680742620140908062008419451962873980014265",
    showsCandidates: true,
};

const POINTING_SHOW_PATTERN = cells([1, 8], [1, 9]);
const POINTING_FOLLOW_PATTERN = cells([8, 9], [9, 9]);
const POINTING_ALONE_PATTERN = cells([7, 4], [9, 4]);

const POINTING: Lesson = {
    id: "pointing",
    steps: [
        { kind: "show", stage: "explain", board: POINTING_SHOW_BOARD, marks: {}, textKey: key("pointing", "toCandidates") },
        {
            kind: "show",
            stage: "explain",
            board: POINTING_SHOW_BOARD,
            marks: { range: boxOf(3), noteDigit: 2, dimOthers: true },
            textKey: key("pointing", "lookAtBox"),
        },
        {
            kind: "show",
            stage: "explain",
            board: POINTING_SHOW_BOARD,
            marks: { range: boxOf(3), pattern: POINTING_SHOW_PATTERN, emphasized: [2], noteDigit: 2, dimOthers: true },
            textKey: key("pointing", "sameLine"),
        },
        {
            kind: "show",
            stage: "explain",
            board: POINTING_SHOW_BOARD,
            marks: { range: rowOf(1), pattern: POINTING_SHOW_PATTERN, emphasized: [2], noteDigit: 2, dimOthers: true },
            textKey: key("pointing", "lineTaken"),
        },
        {
            kind: "show",
            stage: "explain",
            board: POINTING_SHOW_BOARD,
            marks: {
                range: rowOf(1),
                pattern: POINTING_SHOW_PATTERN,
                emphasized: [2],
                eliminated: [removal(1, 2, 2)],
                dimOthers: true,
            },
            textKey: key("pointing", "remove"),
            technique: "pointing",
        },
        {
            kind: "show",
            stage: "explain",
            board: POINTING_SHOW_BOARD,
            marks: { range: boxOf(3), pattern: cells([1, 8], [1, 9], [3, 9]), emphasized: [3], noteDigit: 3, dimOthers: true },
            textKey: key("pointing", "notOneLine"),
        },
        {
            kind: "pick",
            stage: "follow",
            board: POINTING_FOLLOW_BOARD,
            marks: { range: boxOf(9), emphasized: [1], dimOthers: true },
            targets: POINTING_FOLLOW_PATTERN,
            promptKey: key("pointing", "pickPrompt"),
            wrongKey: key("pointing", "pickWrong"),
            successKey: key("pointing", "pickSuccess"),
            hints: [
                { textKey: key("pointing", "pickHintDigit"), marks: { noteDigit: 1 } },
                { textKey: key("pointing", "pickHintFirst"), marks: { lit: [at(8, 9)] } },
                { textKey: key("pointing", "pickHintSecond"), marks: { lit: POINTING_FOLLOW_PATTERN } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: POINTING_FOLLOW_BOARD,
            marks: { range: columnOf(9), pattern: POINTING_FOLLOW_PATTERN, emphasized: [1], dimOthers: true },
            removals: [removal(3, 9, 1)],
            pattern: POINTING_FOLLOW_PATTERN,
            technique: "pointing",
            digits: [1],
            promptKey: key("pointing", "removePrompt"),
            keepKey: key("pointing", "removeKeep"),
            wrongKey: key("pointing", "removeWrong"),
            successKey: key("pointing", "removeSuccess"),
            hints: [
                { textKey: key("pointing", "removeHintLine"), marks: { noteDigit: 1 } },
                { textKey: key("pointing", "removeHintAnswer"), marks: { lit: [at(3, 9)] } },
            ],
        },
        {
            kind: "pick",
            stage: "alone",
            board: POINTING_ALONE_BOARD,
            marks: { range: boxOf(8), emphasized: [3] },
            targets: POINTING_ALONE_PATTERN,
            promptKey: key("pointing", "alonePickPrompt"),
            wrongKey: key("pointing", "alonePickWrong"),
            successKey: key("pointing", "alonePickSuccess"),
            hints: [
                { textKey: key("pointing", "aloneHintDigit"), marks: { range: boxOf(8), noteDigit: 3, dimOthers: true } },
                {
                    textKey: key("pointing", "aloneHintLine"),
                    marks: { range: columnOf(4), pattern: POINTING_ALONE_PATTERN, emphasized: [3], noteDigit: 3, dimOthers: true },
                },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: POINTING_ALONE_BOARD,
            marks: { range: columnOf(4), pattern: POINTING_ALONE_PATTERN, emphasized: [3] },
            removals: [removal(4, 4, 3)],
            pattern: POINTING_ALONE_PATTERN,
            technique: "pointing",
            digits: [3],
            promptKey: key("pointing", "alonePrompt"),
            keepKey: key("pointing", "aloneKeep"),
            wrongKey: key("pointing", "aloneWrong"),
            successKey: key("pointing", "aloneSuccess"),
            hints: [
                {
                    textKey: key("pointing", "aloneHintLine"),
                    marks: { range: columnOf(4), pattern: POINTING_ALONE_PATTERN, emphasized: [3], noteDigit: 3, dimOthers: true },
                },
                { textKey: key("pointing", "aloneHintAnswer"), marks: { lit: [at(4, 4)] } },
            ],
        },
        { kind: "done", stage: "done", board: POINTING_ALONE_BOARD, marks: {}, takeawayKey: key("pointing", "takeaway") },
    ],
};

const CLAIMING_SHOW_BOARD: LessonBoard = {
    values: "369201870100607390070893016831526947726419538954378621010982760607135080200764150",
    showsCandidates: true,
};
const CLAIMING_FOLLOW_BOARD: LessonBoard = {
    values: "264871359379425681185963700716502093003796100092310076927630010031207960608109237",
    showsCandidates: true,
};
const CLAIMING_ALONE_BOARD: LessonBoard = {
    values: "298607015643251879571800602016702050025180760037465201759326100182574006364918527",
    showsCandidates: true,
};

const CLAIMING_SHOW_PATTERN = cells([3, 1], [3, 3]);
const CLAIMING_FOLLOW_PATTERN = cells([7, 7], [7, 9]);
const CLAIMING_ALONE_PATTERN = cells([4, 9], [5, 9]);

const CLAIMING: Lesson = {
    id: "claiming",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: CLAIMING_SHOW_BOARD,
            marks: { range: rowOf(3), noteDigit: 5, dimOthers: true },
            textKey: key("claiming", "lookAtLine"),
        },
        {
            kind: "show",
            stage: "explain",
            board: CLAIMING_SHOW_BOARD,
            marks: { range: rowOf(3), pattern: CLAIMING_SHOW_PATTERN, emphasized: [5], noteDigit: 5, dimOthers: true },
            textKey: key("claiming", "sameBox"),
        },
        {
            kind: "show",
            stage: "explain",
            board: CLAIMING_SHOW_BOARD,
            marks: { range: boxOf(1), pattern: CLAIMING_SHOW_PATTERN, emphasized: [5], noteDigit: 5, dimOthers: true },
            textKey: key("claiming", "boxTaken"),
        },
        {
            kind: "show",
            stage: "explain",
            board: CLAIMING_SHOW_BOARD,
            marks: {
                range: boxOf(1),
                pattern: CLAIMING_SHOW_PATTERN,
                emphasized: [5],
                eliminated: [removal(2, 3, 5)],
                dimOthers: true,
            },
            textKey: key("claiming", "remove"),
            technique: "claiming",
        },
        {
            kind: "show",
            stage: "explain",
            board: CLAIMING_SHOW_BOARD,
            marks: { range: rowOf(3), pattern: cells([3, 3], [3, 7]), emphasized: [2], noteDigit: 2, dimOthers: true },
            textKey: key("claiming", "notOneBox"),
        },
        {
            kind: "pick",
            stage: "follow",
            board: CLAIMING_FOLLOW_BOARD,
            marks: { range: rowOf(7), emphasized: [5], dimOthers: true },
            targets: CLAIMING_FOLLOW_PATTERN,
            promptKey: key("claiming", "pickPrompt"),
            wrongKey: key("claiming", "pickWrong"),
            successKey: key("claiming", "pickSuccess"),
            hints: [
                { textKey: key("claiming", "pickHintDigit"), marks: { noteDigit: 5 } },
                { textKey: key("claiming", "pickHintFirst"), marks: { lit: [at(7, 7)] } },
                { textKey: key("claiming", "pickHintSecond"), marks: { lit: CLAIMING_FOLLOW_PATTERN } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: CLAIMING_FOLLOW_BOARD,
            marks: { range: boxOf(9), pattern: CLAIMING_FOLLOW_PATTERN, emphasized: [5], dimOthers: true },
            removals: [removal(8, 9, 5)],
            pattern: CLAIMING_FOLLOW_PATTERN,
            technique: "claiming",
            digits: [5],
            promptKey: key("claiming", "removePrompt"),
            keepKey: key("claiming", "removeKeep"),
            wrongKey: key("claiming", "removeWrong"),
            successKey: key("claiming", "removeSuccess"),
            hints: [
                { textKey: key("claiming", "removeHintBox"), marks: { noteDigit: 5 } },
                { textKey: key("claiming", "removeHintAnswer"), marks: { lit: [at(8, 9)] } },
            ],
        },
        {
            kind: "pick",
            stage: "alone",
            board: CLAIMING_ALONE_BOARD,
            marks: { range: columnOf(9), emphasized: [3] },
            targets: CLAIMING_ALONE_PATTERN,
            promptKey: key("claiming", "alonePickPrompt"),
            wrongKey: key("claiming", "alonePickWrong"),
            successKey: key("claiming", "alonePickSuccess"),
            hints: [
                { textKey: key("claiming", "aloneHintDigit"), marks: { range: columnOf(9), noteDigit: 3, dimOthers: true } },
                {
                    textKey: key("claiming", "aloneHintBox"),
                    marks: { range: boxOf(6), pattern: CLAIMING_ALONE_PATTERN, emphasized: [3], noteDigit: 3, dimOthers: true },
                },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: CLAIMING_ALONE_BOARD,
            marks: { range: boxOf(6), pattern: CLAIMING_ALONE_PATTERN, emphasized: [3] },
            removals: [removal(4, 7, 3)],
            pattern: CLAIMING_ALONE_PATTERN,
            technique: "claiming",
            digits: [3],
            promptKey: key("claiming", "alonePrompt"),
            keepKey: key("claiming", "aloneKeep"),
            wrongKey: key("claiming", "aloneWrong"),
            successKey: key("claiming", "aloneSuccess"),
            hints: [
                {
                    textKey: key("claiming", "aloneHintBox"),
                    marks: { range: boxOf(6), pattern: CLAIMING_ALONE_PATTERN, emphasized: [3], noteDigit: 3, dimOthers: true },
                },
                { textKey: key("claiming", "aloneHintAnswer"), marks: { lit: [at(4, 7)] } },
            ],
        },
        { kind: "done", stage: "done", board: CLAIMING_ALONE_BOARD, marks: {}, takeawayKey: key("claiming", "takeaway") },
    ],
};

const NAKED_PAIR_SHOW_BOARD: LessonBoard = {
    values: "301489000486257931079316804894673215135824679007591483718965342042038090903042008",
    showsCandidates: true,
};
const NAKED_PAIR_FOLLOW_BOARD: LessonBoard = {
    values: "896453200253917600174628593519246030347581962682379050735064029428095306961032005",
    showsCandidates: true,
};
const NAKED_PAIR_ALONE_BOARD: LessonBoard = {
    values: "095437620037060094046900730982076340573204069461093072714328956358649217629751483",
    showsCandidates: true,
};

const NAKED_PAIR_SHOW_PATTERN = cells([9, 2], [9, 8]);
const NAKED_PAIR_FOLLOW_PATTERN = cells([1, 8], [8, 8]);
const NAKED_PAIR_ALONE_PATTERN = cells([2, 6], [3, 6]);

const NAKED_PAIR: Lesson = {
    id: "nakedPair",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: NAKED_PAIR_SHOW_BOARD,
            marks: { pattern: NAKED_PAIR_SHOW_PATTERN, emphasized: [5, 6], dimOthers: true },
            textKey: key("nakedPair", "sameTwo"),
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_PAIR_SHOW_BOARD,
            marks: { pattern: NAKED_PAIR_SHOW_PATTERN, emphasized: [5, 6], dimOthers: true },
            textKey: key("nakedPair", "oneEach"),
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_PAIR_SHOW_BOARD,
            marks: { range: rowOf(9), pattern: NAKED_PAIR_SHOW_PATTERN, emphasized: [5, 6], dimOthers: true },
            textKey: key("nakedPair", "othersCannot"),
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_PAIR_SHOW_BOARD,
            marks: {
                range: rowOf(9),
                pattern: NAKED_PAIR_SHOW_PATTERN,
                emphasized: [5, 6],
                eliminated: [removal(9, 7, 5)],
                dimOthers: true,
            },
            textKey: key("nakedPair", "remove"),
            technique: "nakedPair",
        },
        {
            kind: "pick",
            stage: "follow",
            board: NAKED_PAIR_FOLLOW_BOARD,
            marks: { range: columnOf(8), emphasized: [1, 7], dimOthers: true },
            targets: NAKED_PAIR_FOLLOW_PATTERN,
            promptKey: key("nakedPair", "pickPrompt"),
            wrongKey: key("nakedPair", "pickWrong"),
            successKey: key("nakedPair", "pickSuccess"),
            hints: [
                { textKey: key("nakedPair", "pickHintCount") },
                { textKey: key("nakedPair", "pickHintFirst"), marks: { lit: [at(1, 8)] } },
                { textKey: key("nakedPair", "pickHintSecond"), marks: { lit: NAKED_PAIR_FOLLOW_PATTERN } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: NAKED_PAIR_FOLLOW_BOARD,
            marks: { range: columnOf(8), pattern: NAKED_PAIR_FOLLOW_PATTERN, emphasized: [1, 7], dimOthers: true },
            removals: [removal(9, 8, 7)],
            pattern: NAKED_PAIR_FOLLOW_PATTERN,
            technique: "nakedPair",
            digits: [1, 7],
            promptKey: key("nakedPair", "removePrompt"),
            keepKey: key("nakedPair", "removeKeep"),
            wrongKey: key("nakedPair", "removeWrong"),
            successKey: key("nakedPair", "removeSuccess"),
            hints: [
                { textKey: key("nakedPair", "removeHintLine") },
                { textKey: key("nakedPair", "removeHintAnswer"), marks: { lit: [at(9, 8)] } },
            ],
        },
        {
            kind: "pick",
            stage: "alone",
            board: NAKED_PAIR_ALONE_BOARD,
            marks: { range: boxOf(2), emphasized: [2, 5] },
            targets: NAKED_PAIR_ALONE_PATTERN,
            promptKey: key("nakedPair", "alonePickPrompt"),
            wrongKey: key("nakedPair", "alonePickWrong"),
            successKey: key("nakedPair", "alonePickSuccess"),
            hints: [
                { textKey: key("nakedPair", "aloneHintCount"), marks: { range: boxOf(2) } },
                {
                    textKey: key("nakedPair", "aloneHintPair"),
                    marks: { range: boxOf(2), pattern: NAKED_PAIR_ALONE_PATTERN, emphasized: [2, 5] },
                },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: NAKED_PAIR_ALONE_BOARD,
            marks: { range: boxOf(2), pattern: NAKED_PAIR_ALONE_PATTERN, emphasized: [2, 5] },
            removals: [removal(2, 4, 5)],
            pattern: NAKED_PAIR_ALONE_PATTERN,
            technique: "nakedPair",
            digits: [2, 5],
            promptKey: key("nakedPair", "alonePrompt"),
            keepKey: key("nakedPair", "aloneKeep"),
            wrongKey: key("nakedPair", "aloneWrong"),
            successKey: key("nakedPair", "aloneSuccess"),
            hints: [
                {
                    textKey: key("nakedPair", "aloneHintPair"),
                    marks: { range: boxOf(2), pattern: NAKED_PAIR_ALONE_PATTERN, emphasized: [2, 5] },
                },
                { textKey: key("nakedPair", "aloneHintAnswer"), marks: { lit: [at(2, 4)] } },
            ],
        },
        { kind: "done", stage: "done", board: NAKED_PAIR_ALONE_BOARD, marks: {}, takeawayKey: key("nakedPair", "takeaway") },
    ],
};

const HIDDEN_PAIR_SHOW_BOARD: LessonBoard = {
    values: "152943678003106002046028310294815736060394251315267984529031807430080000600000003",
    showsCandidates: true,
};
const HIDDEN_PAIR_FOLLOW_BOARD: LessonBoard = {
    values: "107230594094501030352000801020050007070362000900710020546193000738025000219007053",
    showsCandidates: true,
};
const HIDDEN_PAIR_ALONE_BOARD: LessonBoard = {
    values: "152089000493017000786050109501098436300005091900130000639841275045970010017500900",
    showsCandidates: true,
};

const HIDDEN_PAIR_SHOW_PATTERN = cells([9, 6], [9, 8]);
const HIDDEN_PAIR_FOLLOW_PATTERN = cells([2, 7], [7, 7]);
const HIDDEN_PAIR_ALONE_PATTERN = cells([1, 7], [1, 9]);

const HIDDEN_PAIR: Lesson = {
    id: "hiddenPair",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_PAIR_SHOW_BOARD,
            marks: { range: rowOf(9), noteDigit: 2, dimOthers: true },
            textKey: key("hiddenPair", "firstDigit"),
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_PAIR_SHOW_BOARD,
            marks: { range: rowOf(9), noteDigit: 9, dimOthers: true },
            textKey: key("hiddenPair", "secondDigit"),
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_PAIR_SHOW_BOARD,
            marks: { range: rowOf(9), pattern: HIDDEN_PAIR_SHOW_PATTERN, emphasized: [2, 9], dimOthers: true },
            textKey: key("hiddenPair", "onlyPlaces"),
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_PAIR_SHOW_BOARD,
            marks: { range: rowOf(9), pattern: HIDDEN_PAIR_SHOW_PATTERN, emphasized: [2, 9], dimOthers: true },
            textKey: key("hiddenPair", "noRoom"),
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_PAIR_SHOW_BOARD,
            marks: {
                range: rowOf(9),
                pattern: HIDDEN_PAIR_SHOW_PATTERN,
                emphasized: [2, 9],
                eliminated: [removal(9, 8, 4)],
                dimOthers: true,
            },
            textKey: key("hiddenPair", "remove"),
            technique: "hiddenPair",
        },
        {
            kind: "pick",
            stage: "follow",
            board: HIDDEN_PAIR_FOLLOW_BOARD,
            marks: { range: columnOf(7), emphasized: [2, 7], dimOthers: true },
            targets: HIDDEN_PAIR_FOLLOW_PATTERN,
            promptKey: key("hiddenPair", "pickPrompt"),
            wrongKey: key("hiddenPair", "pickWrong"),
            successKey: key("hiddenPair", "pickSuccess"),
            hints: [
                { textKey: key("hiddenPair", "pickHintDigit"), marks: { noteDigit: 2 } },
                { textKey: key("hiddenPair", "pickHintFirst"), marks: { lit: [at(2, 7)] } },
                { textKey: key("hiddenPair", "pickHintSecond"), marks: { lit: HIDDEN_PAIR_FOLLOW_PATTERN } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: HIDDEN_PAIR_FOLLOW_BOARD,
            marks: { range: columnOf(7), pattern: HIDDEN_PAIR_FOLLOW_PATTERN, emphasized: [2, 7], dimOthers: true },
            removals: [removal(2, 7, 6)],
            pattern: HIDDEN_PAIR_FOLLOW_PATTERN,
            technique: "hiddenPair",
            promptKey: key("hiddenPair", "removePrompt"),
            keepKey: key("hiddenPair", "removeKeep"),
            wrongKey: key("hiddenPair", "removeWrong"),
            successKey: key("hiddenPair", "removeSuccess"),
            hints: [
                { textKey: key("hiddenPair", "removeHintExtra") },
                { textKey: key("hiddenPair", "removeHintAnswer"), marks: { lit: [at(2, 7)] } },
            ],
        },
        {
            kind: "pick",
            stage: "alone",
            board: HIDDEN_PAIR_ALONE_BOARD,
            marks: { range: boxOf(3), emphasized: [3, 7] },
            targets: HIDDEN_PAIR_ALONE_PATTERN,
            promptKey: key("hiddenPair", "alonePickPrompt"),
            wrongKey: key("hiddenPair", "alonePickWrong"),
            successKey: key("hiddenPair", "alonePickSuccess"),
            hints: [
                { textKey: key("hiddenPair", "aloneHintBox"), marks: { range: boxOf(3) } },
                {
                    textKey: key("hiddenPair", "aloneHintPair"),
                    marks: { range: boxOf(3), pattern: HIDDEN_PAIR_ALONE_PATTERN, emphasized: [3, 7] },
                },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: HIDDEN_PAIR_ALONE_BOARD,
            marks: { pattern: HIDDEN_PAIR_ALONE_PATTERN, emphasized: [3, 7] },
            removals: [removal(1, 7, 6), removal(1, 9, 4)],
            pattern: HIDDEN_PAIR_ALONE_PATTERN,
            technique: "hiddenPair",
            promptKey: key("hiddenPair", "alonePrompt"),
            keepKey: key("hiddenPair", "aloneKeep"),
            wrongKey: key("hiddenPair", "aloneWrong"),
            successKey: key("hiddenPair", "aloneSuccess"),
            hints: [
                {
                    textKey: key("hiddenPair", "aloneHintPair"),
                    marks: { range: boxOf(3), pattern: HIDDEN_PAIR_ALONE_PATTERN, emphasized: [3, 7] },
                },
                { textKey: key("hiddenPair", "aloneHintAnswer"), marks: { lit: HIDDEN_PAIR_ALONE_PATTERN } },
            ],
        },
        { kind: "done", stage: "done", board: HIDDEN_PAIR_ALONE_BOARD, marks: {}, takeawayKey: key("hiddenPair", "takeaway") },
    ],
};

const NAKED_TRIPLE_SHOW_BOARD: LessonBoard = {
    values: "400052030235060004100430205814976352726513849359284000542398716681725493973641528",
    showsCandidates: true,
};
const NAKED_QUAD_SHOW_BOARD: LessonBoard = {
    values: "002704013740310500013520647000030450201490036034000000425673198387951264169842375",
    showsCandidates: true,
};
const NAKED_SUBSET_FOLLOW_BOARD: LessonBoard = {
    values: "008674501065821007000359806694517283583296714000438965209165078056782109817943652",
    showsCandidates: true,
};
const NAKED_SUBSET_ALONE_BOARD: LessonBoard = {
    values: "834572619756819243192463785071346050500721036603985170010630507305197000007250301",
    showsCandidates: true,
};

const NAKED_TRIPLE_SHOW_PATTERN = cells([1, 3], [1, 4], [1, 9]);
const NAKED_QUAD_SHOW_PATTERN = cells([4, 1], [4, 2], [4, 3], [4, 6]);
const NAKED_SUBSET_FOLLOW_PATTERN = cells([1, 1], [2, 1], [8, 1]);
const NAKED_SUBSET_ALONE_PATTERN = cells([7, 8], [8, 8], [9, 8]);

const NAKED_SUBSET: Lesson = {
    id: "nakedSubset",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: NAKED_TRIPLE_SHOW_BOARD,
            marks: { pattern: NAKED_TRIPLE_SHOW_PATTERN, emphasized: [1, 7, 8], dimOthers: true },
            textKey: key("nakedSubset", "threeCells"),
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_TRIPLE_SHOW_BOARD,
            marks: { pattern: NAKED_TRIPLE_SHOW_PATTERN, emphasized: [1, 7, 8], dimOthers: true },
            textKey: key("nakedSubset", "threeDigits"),
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_TRIPLE_SHOW_BOARD,
            marks: { range: rowOf(1), pattern: NAKED_TRIPLE_SHOW_PATTERN, emphasized: [1, 7, 8], dimOthers: true },
            textKey: key("nakedSubset", "othersCannot"),
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_TRIPLE_SHOW_BOARD,
            marks: {
                range: rowOf(1),
                pattern: NAKED_TRIPLE_SHOW_PATTERN,
                emphasized: [1, 7, 8],
                eliminated: [removal(1, 7, 1)],
                dimOthers: true,
            },
            textKey: key("nakedSubset", "remove"),
            technique: "nakedTriple",
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_QUAD_SHOW_BOARD,
            marks: { range: rowOf(4), pattern: NAKED_QUAD_SHOW_PATTERN, emphasized: [6, 7, 8, 9], dimOthers: true },
            textKey: key("nakedSubset", "quad"),
        },
        {
            kind: "show",
            stage: "explain",
            board: NAKED_QUAD_SHOW_BOARD,
            marks: {
                range: rowOf(4),
                pattern: NAKED_QUAD_SHOW_PATTERN,
                emphasized: [6, 7, 8, 9],
                eliminated: [removal(4, 9, 9)],
                dimOthers: true,
            },
            textKey: key("nakedSubset", "quadRemove"),
            technique: "nakedQuad",
        },
        {
            kind: "pick",
            stage: "follow",
            board: NAKED_SUBSET_FOLLOW_BOARD,
            marks: { range: columnOf(1), emphasized: [3, 4, 9], dimOthers: true },
            targets: NAKED_SUBSET_FOLLOW_PATTERN,
            promptKey: key("nakedSubset", "pickPrompt"),
            wrongKey: key("nakedSubset", "pickWrong"),
            successKey: key("nakedSubset", "pickSuccess"),
            hints: [
                { textKey: key("nakedSubset", "pickHintExclude") },
                { textKey: key("nakedSubset", "pickHintFirst"), marks: { lit: cells([1, 1], [2, 1]) } },
                { textKey: key("nakedSubset", "pickHintLast"), marks: { lit: NAKED_SUBSET_FOLLOW_PATTERN } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: NAKED_SUBSET_FOLLOW_BOARD,
            marks: { range: columnOf(1), pattern: NAKED_SUBSET_FOLLOW_PATTERN, emphasized: [3, 4, 9], dimOthers: true },
            removals: [removal(3, 1, 4)],
            pattern: NAKED_SUBSET_FOLLOW_PATTERN,
            technique: "nakedTriple",
            digits: [3, 4, 9],
            promptKey: key("nakedSubset", "removePrompt"),
            keepKey: key("nakedSubset", "removeKeep"),
            wrongKey: key("nakedSubset", "removeWrong"),
            successKey: key("nakedSubset", "removeSuccess"),
            hints: [
                { textKey: key("nakedSubset", "removeHintLine") },
                { textKey: key("nakedSubset", "removeHintAnswer"), marks: { lit: [at(3, 1)] } },
            ],
        },
        {
            kind: "pick",
            stage: "alone",
            board: NAKED_SUBSET_ALONE_BOARD,
            marks: { range: boxOf(9), emphasized: [2, 6, 9] },
            targets: NAKED_SUBSET_ALONE_PATTERN,
            promptKey: key("nakedSubset", "alonePickPrompt"),
            wrongKey: key("nakedSubset", "alonePickWrong"),
            successKey: key("nakedSubset", "alonePickSuccess"),
            hints: [
                { textKey: key("nakedSubset", "aloneHintExclude"), marks: { range: boxOf(9) } },
                {
                    textKey: key("nakedSubset", "aloneHintTriple"),
                    marks: { range: boxOf(9), pattern: NAKED_SUBSET_ALONE_PATTERN, emphasized: [2, 6, 9] },
                },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: NAKED_SUBSET_ALONE_BOARD,
            marks: { range: boxOf(9), pattern: NAKED_SUBSET_ALONE_PATTERN, emphasized: [2, 6, 9] },
            removals: [removal(8, 9, 2)],
            pattern: NAKED_SUBSET_ALONE_PATTERN,
            technique: "nakedTriple",
            digits: [2, 6, 9],
            promptKey: key("nakedSubset", "alonePrompt"),
            keepKey: key("nakedSubset", "aloneKeep"),
            wrongKey: key("nakedSubset", "aloneWrong"),
            successKey: key("nakedSubset", "aloneSuccess"),
            hints: [
                {
                    textKey: key("nakedSubset", "aloneHintTriple"),
                    marks: { range: boxOf(9), pattern: NAKED_SUBSET_ALONE_PATTERN, emphasized: [2, 6, 9] },
                },
                { textKey: key("nakedSubset", "aloneHintAnswer"), marks: { lit: [at(8, 9)] } },
            ],
        },
        { kind: "done", stage: "done", board: NAKED_SUBSET_ALONE_BOARD, marks: {}, takeawayKey: key("nakedSubset", "takeaway") },
    ],
};

const HIDDEN_TRIPLE_SHOW_BOARD: LessonBoard = {
    values: "060384070087625031300179080090730065030910020870450010013047090608091040749063150",
    removedCandidates: [removal(8, 7, 2), removal(8, 9, 2)],
    showsCandidates: true,
};
const HIDDEN_QUAD_SHOW_BOARD: LessonBoard = {
    values: "000902741920401863000306925000735104000148602000269307000813079010594236390627018",
    showsCandidates: true,
};
const HIDDEN_SUBSET_FOLLOW_BOARD: LessonBoard = {
    values: "200090400009400050764581932072005000840019003000004000698173000417050389523948167",
    removedCandidates: [
        removal(1, 4, 7),
        removal(4, 1, 3),
        removal(4, 9, 6),
        removal(4, 9, 8),
        removal(6, 4, 3),
        removal(6, 5, 3),
        removal(6, 9, 1),
    ],
    showsCandidates: true,
};
const HIDDEN_SUBSET_ALONE_BOARD: LessonBoard = {
    values: "300094005960305000845726319218003004009002106000901802084039200000408003593207000",
    removedCandidates: [
        removal(4, 7, 7),
        removal(5, 2, 7),
        removal(6, 2, 7),
        removal(8, 7, 6),
        removal(8, 7, 7),
    ],
    showsCandidates: true,
};

const HIDDEN_TRIPLE_SHOW_PATTERN = cells([1, 7], [3, 7], [7, 7]);
const HIDDEN_QUAD_SHOW_PATTERN = cells([1, 3], [4, 3], [5, 3], [7, 3]);
const HIDDEN_SUBSET_FOLLOW_PATTERN = cells([4, 8], [4, 9], [6, 8]);
const HIDDEN_SUBSET_ALONE_PATTERN = cells([1, 8], [2, 8], [9, 8]);

const HIDDEN_SUBSET: Lesson = {
    id: "hiddenSubset",
    steps: [
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_TRIPLE_SHOW_BOARD,
            marks: { range: columnOf(7), pattern: HIDDEN_TRIPLE_SHOW_PATTERN, emphasized: [2, 5, 6], dimOthers: true },
            textKey: key("hiddenSubset", "threeDigits"),
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_TRIPLE_SHOW_BOARD,
            marks: { range: columnOf(7), pattern: HIDDEN_TRIPLE_SHOW_PATTERN, emphasized: [2, 5, 6], dimOthers: true },
            textKey: key("hiddenSubset", "onlyPlaces"),
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_TRIPLE_SHOW_BOARD,
            marks: {
                range: columnOf(7),
                pattern: HIDDEN_TRIPLE_SHOW_PATTERN,
                emphasized: [2, 5, 6],
                eliminated: [removal(1, 7, 9), removal(3, 7, 4), removal(7, 7, 8)],
                dimOthers: true,
            },
            textKey: key("hiddenSubset", "remove"),
            technique: "hiddenTriple",
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_QUAD_SHOW_BOARD,
            marks: { range: columnOf(3), pattern: HIDDEN_QUAD_SHOW_PATTERN, emphasized: [2, 3, 6, 9], dimOthers: true },
            textKey: key("hiddenSubset", "quad"),
        },
        {
            kind: "show",
            stage: "explain",
            board: HIDDEN_QUAD_SHOW_BOARD,
            marks: {
                range: columnOf(3),
                pattern: HIDDEN_QUAD_SHOW_PATTERN,
                emphasized: [2, 3, 6, 9],
                eliminated: [
                    removal(1, 3, 5),
                    removal(1, 3, 8),
                    removal(4, 3, 8),
                    removal(5, 3, 5),
                    removal(5, 3, 7),
                    removal(7, 3, 4),
                    removal(7, 3, 5),
                ],
                dimOthers: true,
            },
            textKey: key("hiddenSubset", "quadRemove"),
            technique: "hiddenQuad",
        },
        {
            kind: "pick",
            stage: "follow",
            board: HIDDEN_SUBSET_FOLLOW_BOARD,
            marks: { range: boxOf(6), emphasized: [1, 4, 9], dimOthers: true },
            targets: HIDDEN_SUBSET_FOLLOW_PATTERN,
            promptKey: key("hiddenSubset", "pickPrompt"),
            wrongKey: key("hiddenSubset", "pickWrong"),
            successKey: key("hiddenSubset", "pickSuccess"),
            hints: [
                { textKey: key("hiddenSubset", "pickHintFour"), marks: { noteDigit: 4 } },
                { textKey: key("hiddenSubset", "pickHintNine"), marks: { noteDigit: 9 } },
                { textKey: key("hiddenSubset", "pickHintAnswer"), marks: { lit: HIDDEN_SUBSET_FOLLOW_PATTERN } },
            ],
        },
        {
            kind: "remove",
            stage: "follow",
            board: HIDDEN_SUBSET_FOLLOW_BOARD,
            marks: { range: boxOf(6), pattern: HIDDEN_SUBSET_FOLLOW_PATTERN, emphasized: [1, 4, 9], dimOthers: true },
            removals: [removal(6, 8, 2), removal(6, 8, 7)],
            pattern: HIDDEN_SUBSET_FOLLOW_PATTERN,
            technique: "hiddenTriple",
            promptKey: key("hiddenSubset", "removePrompt"),
            keepKey: key("hiddenSubset", "removeKeep"),
            wrongKey: key("hiddenSubset", "removeWrong"),
            successKey: key("hiddenSubset", "removeSuccess"),
            hints: [
                { textKey: key("hiddenSubset", "removeHintExtra") },
                { textKey: key("hiddenSubset", "removeHintAnswer"), marks: { lit: [at(6, 8)] } },
            ],
        },
        {
            kind: "pick",
            stage: "alone",
            board: HIDDEN_SUBSET_ALONE_BOARD,
            marks: { range: columnOf(8), emphasized: [2, 4, 8] },
            targets: HIDDEN_SUBSET_ALONE_PATTERN,
            promptKey: key("hiddenSubset", "alonePickPrompt"),
            wrongKey: key("hiddenSubset", "alonePickWrong"),
            successKey: key("hiddenSubset", "alonePickSuccess"),
            hints: [
                { textKey: key("hiddenSubset", "aloneHintFew"), marks: { range: columnOf(8) } },
                {
                    textKey: key("hiddenSubset", "aloneHintTriple"),
                    marks: { range: columnOf(8), pattern: HIDDEN_SUBSET_ALONE_PATTERN, emphasized: [2, 4, 8] },
                },
            ],
        },
        {
            kind: "remove",
            stage: "alone",
            board: HIDDEN_SUBSET_ALONE_BOARD,
            marks: { pattern: HIDDEN_SUBSET_ALONE_PATTERN, emphasized: [2, 4, 8] },
            removals: [removal(1, 8, 6), removal(1, 8, 7), removal(2, 8, 7), removal(9, 8, 6)],
            pattern: HIDDEN_SUBSET_ALONE_PATTERN,
            technique: "hiddenTriple",
            promptKey: key("hiddenSubset", "alonePrompt"),
            keepKey: key("hiddenSubset", "aloneKeep"),
            wrongKey: key("hiddenSubset", "aloneWrong"),
            successKey: key("hiddenSubset", "aloneSuccess"),
            hints: [
                {
                    textKey: key("hiddenSubset", "aloneHintTriple"),
                    marks: { range: columnOf(8), pattern: HIDDEN_SUBSET_ALONE_PATTERN, emphasized: [2, 4, 8] },
                },
                { textKey: key("hiddenSubset", "aloneHintAnswer"), marks: { lit: HIDDEN_SUBSET_ALONE_PATTERN } },
            ],
        },
        { kind: "done", stage: "done", board: HIDDEN_SUBSET_ALONE_BOARD, marks: {}, takeawayKey: key("hiddenSubset", "takeaway") },
    ],
};

export const MEDIUM_LESSONS: Record<"pointing" | "claiming" | "nakedPair" | "hiddenPair" | "nakedSubset" | "hiddenSubset", Lesson> = {
    pointing: POINTING,
    claiming: CLAIMING,
    nakedPair: NAKED_PAIR,
    hiddenPair: HIDDEN_PAIR,
    nakedSubset: NAKED_SUBSET,
    hiddenSubset: HIDDEN_SUBSET,
};
