import type { AppLocale } from "@/application/settings/SettingsStorage";

export interface ChangelogChange {
    text: Record<AppLocale, string>;
    appOnly?: boolean;
}

export interface ChangelogEntry {
    version: string;
    date: string;
    /** One object per bullet with both languages, so the languages cannot drift apart. */
    changes: ChangelogChange[];
}

/**
 * Player-facing changes merged since the last release, newest last. Develop builds show them on top of
 * the changelog; at release they move into the new version's entry (docs/release.md).
 */
export const UNRELEASED_CHANGES: ChangelogChange[] = [
    {
        text: {
            en: "A new style: 8-bit, with a Handheld and a Console look",
            "zh-Hant": "新風格「8-bit 電玩」，有掌機和紅白機兩種模式",
        },
    },
    {
        text: {
            en: "A new Appearance page puts the style, colour, light or dark and the app icon together",
            "zh-Hant": "新的「外觀」頁面，把風格、主題色、深淺色和 App 圖示放在一起",
        },
    },
    {
        text: {
            en: "Each style has its own app icon",
            "zh-Hant": "每種風格都有自己的 App 圖示",
        },
        appOnly: true,
    },
    {
        text: {
            en: "Light or dark follows your device the first time you open the app; after that, you choose",
            "zh-Hant": "第一次開啟時依手機設定決定淺色或深色，之後由你自己選",
        },
    },
    {
        text: {
            en: "Paper Notebook is now light only",
            "zh-Hant": "紙本筆記改為只有淺色",
        },
    },
    {
        text: {
            en: "Your game is kept even if the app is closed while it is in the background",
            "zh-Hant": "App 在背景被關掉時，遊戲進度也會保留",
        },
    },
    {
        text: {
            en: "Closing Reveal Cell's steps early now fills in the answer",
            "zh-Hant": "「揭示一格」的步驟看到一半按關閉，也會直接填入答案",
        },
    },
];

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "2.2.0",
        date: "2026-10-23",
        changes: [
            {
                text: {
                    en: "A fresh look: choose from three styles, Minimal Motion, Tactile Tiles and Paper Notebook, each with its own colours, in light or dark mode",
                    "zh-Hant": "全新外觀：三種風格可以選（極簡動態、實體方塊、紙本筆記），各有自己的主題色，並支援淺色和深色模式",
                },
            },
            {
                text: {
                    en: "Reveal Cell now walks you through the reasoning step by step",
                    "zh-Hant": "「揭示一格」會一步一步帶你看推理過程",
                },
            },
            {
                text: {
                    en: "Game Review and the Walkthrough play step by step and are easier to follow",
                    "zh-Hant": "遊戲回顧和解題演示改成逐步播放，更容易看懂",
                },
            },
            {
                text: {
                    en: "Statistics show more for each difficulty",
                    "zh-Hant": "統計頁可以依難度看到更多紀錄",
                },
            },
            {
                text: {
                    en: "Smoother play: quicker notes, clearer highlights and many small improvements",
                    "zh-Hant": "操作更順手：寫筆記更快、標示更清楚，還有許多小改善",
                },
            },
            {
                text: {
                    en: "Lighter and more natural: about half the download size, and Back closes menus and dialogs first",
                    "zh-Hant": "更輕巧也更好用：下載大小減少約一半，返回鍵會先關閉選單和對話框",
                },
                appOnly: true,
            },
        ],
    },
    {
        version: "2.1.1",
        date: "2026-10-21",
        changes: [
            {
                text: {
                    en: "Changing the app icon no longer closes the app; the new icon appears once you leave it",
                    "zh-Hant": "更換 App 圖示時不會再關掉 App，離開 App 後就會看到新圖示",
                },
                appOnly: true,
            },
            {
                text: {
                    en: "Theme-colored app icons now fill the whole icon instead of sitting on a white circle",
                    "zh-Hant": "配合主題顏色的 App 圖示改為填滿整個圖示，不再縮在白色圓底裡",
                },
                appOnly: true,
            },
        ],
    },
    {
        version: "2.1.0",
        date: "2026-10-21",
        changes: [
            {
                text: {
                    en: "Now in Traditional Chinese; pick the language in Settings",
                    "zh-Hant": "支援繁體中文，可以在設定中切換語言",
                },
            },
            {
                text: {
                    en: "The Walkthrough looks tidier on small screens",
                    "zh-Hant": "解題演示在小螢幕上的畫面更整齊",
                },
            },
            {
                text: {
                    en: "The Walkthrough's step count is now centered",
                    "zh-Hant": "解題演示的步數改為置中顯示",
                },
            },
            {
                text: {
                    en: "Game Review shows every move, even if you left a game and came back to it",
                    "zh-Hant": "中途離開再回來的遊戲，遊戲回顧也會顯示每一步",
                },
            },
            {
                text: {
                    en: "Games you gave up by starting a new one can now be replayed from Statistics",
                    "zh-Hant": "因為開始新遊戲而放棄的遊戲，也能從統計打開遊戲回顧",
                },
            },
        ],
    },
    {
        version: "2.0.0",
        date: "2026-10-21",
        changes: [
            {
                text: {
                    en: "Now available as an Android app",
                    "zh-Hant": "推出 Android App",
                },
            },
            {
                text: {
                    en: "The app icon can match your color theme",
                    "zh-Hant": "App 圖示可以配合你選的色彩主題",
                },
                appOnly: true,
            },
        ],
    },
    {
        version: "1.6.0",
        date: "2026-04-20",
        changes: [
            {
                text: {
                    en: "Hints and the Walkthrough know two more techniques: X-Chain and XY-Chain",
                    "zh-Hant": "提示與解題演示新增兩種技巧：X 鏈與 XY 鏈",
                },
            },
            {
                text: {
                    en: "The Walkthrough draws chain links right on the board",
                    "zh-Hant": "解題演示會直接在盤面上畫出鏈的連線",
                },
            },
            {
                text: {
                    en: "New Changelog page in Settings",
                    "zh-Hant": "設定裡新增更新日誌頁面",
                },
            },
        ],
    },
    {
        version: "1.5.1",
        date: "2026-04-20",
        changes: [
            {
                text: {
                    en: "The Walkthrough no longer shows play buttons before you start solving",
                    "zh-Hant": "解題演示在開始解題前不會再出現播放按鈕",
                },
            },
        ],
    },
    {
        version: "1.5.0",
        date: "2026-04-20",
        changes: [
            {
                text: {
                    en: "New Walkthrough: enter any puzzle and watch it solved step by step",
                    "zh-Hant": "新增解題演示：輸入任何題目，一步一步看它怎麼解",
                },
            },
            {
                text: {
                    en: "Hints now tell you which technique they use",
                    "zh-Hant": "提示會告訴你用的是哪一種技巧",
                },
            },
            {
                text: {
                    en: "Hints and the Walkthrough know more techniques: X-Wing, Swordfish, Jellyfish, XY-Wing, W-Wing, XYZ-Wing, WXYZ-Wing",
                    "zh-Hant": "提示與解題演示新增技巧：X-Wing、Swordfish、Jellyfish、XY-Wing、W-Wing、XYZ-Wing、WXYZ-Wing",
                },
            },
            {
                text: {
                    en: "Each difficulty now matches the techniques its puzzles need",
                    "zh-Hant": "題目難度更準確，會依解題需要的技巧來分級",
                },
            },
        ],
    },
    {
        version: "1.4.0",
        date: "2026-04-16",
        changes: [
            {
                text: {
                    en: "New Game Review: replay a finished game from Statistics",
                    "zh-Hant": "新增遊戲回顧：可以從統計重播玩過的遊戲",
                },
            },
            {
                text: {
                    en: "Smoother playback, with a progress bar you can drag",
                    "zh-Hant": "播放更順暢，進度條可以拖曳",
                },
            },
            {
                text: {
                    en: "The title bar stays in view while you scroll Settings and Game Review",
                    "zh-Hant": "捲動設定與遊戲回顧時，標題列會留在畫面上方",
                },
            },
        ],
    },
    {
        version: "1.3.1",
        date: "2026-04-13",
        changes: [
            {
                text: {
                    en: "Small fixes to keep the game running smoothly",
                    "zh-Hant": "小幅修正，讓遊戲更穩定",
                },
            },
        ],
    },
    {
        version: "1.3.0",
        date: "2026-04-13",
        changes: [
            {
                text: {
                    en: "Fireworks when you solve a puzzle",
                    "zh-Hant": "解完題目時會放煙火",
                },
            },
            {
                text: {
                    en: "Each color theme gets a matching home screen icon",
                    "zh-Hant": "每種色彩主題都有同色的主畫面圖示",
                },
            },
            {
                text: {
                    en: "Settings is split into clear sections",
                    "zh-Hant": "設定頁分成幾個區塊，更容易找到",
                },
            },
        ],
    },
    {
        version: "1.2.0",
        date: "2026-04-08",
        changes: [
            {
                text: {
                    en: "Choose from 6 color themes and turn game helpers on or off in Settings",
                    "zh-Hant": "設定裡可以選 6 種色彩主題，也能開關遊戲輔助功能",
                },
            },
            {
                text: {
                    en: "Buttons and highlights follow your theme's color",
                    "zh-Hant": "按鈕與標示會跟著主題換顏色",
                },
            },
            {
                text: {
                    en: "A ripple plays when you complete a row, column or box",
                    "zh-Hant": "完成一列、一欄或一宮時會出現漣漪動畫",
                },
            },
            {
                text: {
                    en: "Pop-ups and the hint menu open and close more smoothly",
                    "zh-Hant": "彈出視窗與提示選單的開關更順暢",
                },
            },
        ],
    },
    {
        version: "1.1.1",
        date: "2026-04-07",
        changes: [
            {
                text: {
                    en: "Highlighted notes keep their round shape on small screens",
                    "zh-Hant": "小螢幕上被標示的筆記不會再變形",
                },
            },
        ],
    },
    {
        version: "1.1.0",
        date: "2026-04-07",
        changes: [
            {
                text: {
                    en: "Statistics tells you when you haven't played any games yet",
                    "zh-Hant": "還沒玩過遊戲時，統計頁會清楚告訴你",
                },
            },
            {
                text: {
                    en: "You can clear all records from Statistics, after confirming",
                    "zh-Hant": "可以在統計清除所有紀錄，清除前會先確認",
                },
            },
            {
                text: {
                    en: "Settings shows which version you're on",
                    "zh-Hant": "設定頁會顯示目前的版本",
                },
            },
            {
                text: {
                    en: "Erasing a number also removes it from notes in the same row, column and box",
                    "zh-Hant": "擦掉已填的數字時，同列、同欄、同宮筆記裡的相同數字也會一起清掉",
                },
            },
        ],
    },
];
