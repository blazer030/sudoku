import type { AppLocale } from "@/application/SettingsStorage";

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

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "2.1.1",
        date: "2026-10-21",
        changes: [
            {
                text: {
                    en: "Changing the launcher icon no longer closes the app; the new icon appears after you leave it (App)",
                    "zh-Hant": "更換 App 圖示時不會再直接關閉 App，離開 App 後就會換成新圖示（App）",
                },
            },
            {
                text: {
                    en: "Theme launcher icons now fill the icon shape instead of sitting on a white circle (App)",
                    "zh-Hant": "主題 App 圖示改為滿版顯示，不再縮在白色圓底裡（App）",
                },
            },
        ],
    },
    {
        version: "2.1.0",
        date: "2026-10-21",
        changes: [
            {
                text: {
                    en: "Traditional Chinese support; choose the language in Settings",
                    "zh-Hant": "支援繁體中文，可在設定中切換語言",
                },
            },
            {
                text: {
                    en: "Walkthrough chain lines and gridlines stay aligned on narrow screens",
                    "zh-Hant": "修正解題演示在窄螢幕上連線與格線對不齊的問題",
                },
            },
            {
                text: {
                    en: "Walkthrough step counter is centered",
                    "zh-Hant": "解題演示的步數改為置中",
                },
            },
            {
                text: {
                    en: "Game Review keeps the full history after you leave and resume a game",
                    "zh-Hant": "離開後再繼續的遊戲，遊戲回顧會保留完整紀錄",
                },
            },
            {
                text: {
                    en: "Games abandoned by starting a new one can now be reviewed in Statistics",
                    "zh-Hant": "因開始新遊戲而放棄的遊戲，也能在統計中回顧",
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
                    en: "First app release",
                    "zh-Hant": "首次推出 App 版本",
                },
            },
            {
                text: {
                    en: "Launcher icon can match the selected color theme (App)",
                    "zh-Hant": "App 圖示可配合所選的色彩主題（App）",
                },
            },
        ],
    },
    {
        version: "1.6.0",
        date: "2026-04-20",
        changes: [
            {
                text: {
                    en: "New solver techniques: X-Chain and XY-Chain",
                    "zh-Hant": "新增解題技巧：X 鏈與 XY 鏈",
                },
            },
            {
                text: {
                    en: "Walkthrough visualizes chain links over the board",
                    "zh-Hant": "解題演示會在盤面上標示鏈的連結",
                },
            },
            {
                text: {
                    en: "Added a Changelog page accessible from Settings",
                    "zh-Hant": "新增更新日誌頁面，可從設定進入",
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
                    en: "Fixed Walkthrough showing playback controls before solving starts",
                    "zh-Hant": "修正解題演示在開始解題前就顯示播放控制的問題",
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
                    en: "Added Solver Walkthrough page for entering puzzles and watching them solved step by step",
                    "zh-Hant": "新增解題演示頁面，可輸入題目並逐步觀看解題過程",
                },
            },
            {
                text: {
                    en: "Hint now displays the name of the solving technique used",
                    "zh-Hant": "提示現在會顯示所用的解題技巧名稱",
                },
            },
            {
                text: {
                    en: "New solver techniques: X-Wing, Swordfish, Jellyfish, XY-Wing, W-Wing, XYZ-Wing, WXYZ-Wing",
                    "zh-Hant": "新增解題技巧：X-Wing、Swordfish、Jellyfish、XY-Wing、W-Wing、XYZ-Wing、WXYZ-Wing",
                },
            },
            {
                text: {
                    en: "Puzzle generation enforces difficulty against the techniques required to solve",
                    "zh-Hant": "出題時會依解題所需的技巧來控制難度",
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
                    en: "Added Game Review to replay completed games (open from Statistics)",
                    "zh-Hant": "新增遊戲回顧，可重播已完成的遊戲（從統計進入）",
                },
            },
            {
                text: {
                    en: "Smoother playback controls with a draggable progress bar",
                    "zh-Hant": "播放控制更順暢，並新增可拖曳的進度條",
                },
            },
            {
                text: {
                    en: "Sticky headers when scrolling Settings and Game Review",
                    "zh-Hant": "捲動設定與遊戲回顧時，標題列會固定在頂端",
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
                    en: "Fixed a game interaction bug",
                    "zh-Hant": "修正一個遊戲操作的問題",
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
                    en: "Fireworks effect when completing a game",
                    "zh-Hant": "完成遊戲時顯示煙火效果",
                },
            },
            {
                text: {
                    en: "Each color theme ships its own app icon and PWA manifest",
                    "zh-Hant": "每個色彩主題都有專屬的 App 圖示與 PWA 資訊清單",
                },
            },
            {
                text: {
                    en: "Settings page restyled with a sectioned card layout",
                    "zh-Hant": "設定頁面改用分區卡片版面",
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
                    en: "Redesigned Settings page with 6 color themes and gameplay toggles",
                    "zh-Hant": "重新設計設定頁面，提供 6 種色彩主題與遊戲選項開關",
                },
            },
            {
                text: {
                    en: "App accent color follows the selected theme",
                    "zh-Hant": "App 強調色會跟隨所選主題",
                },
            },
            {
                text: {
                    en: "Ripple animation when completing a row, column, or box",
                    "zh-Hant": "完成一列、一欄或一個九宮格時顯示漣漪動畫",
                },
            },
            {
                text: {
                    en: "Smoother modal and hint popup transitions",
                    "zh-Hant": "對話框與提示彈出視窗的轉場更順暢",
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
                    en: "Fixed note highlight circles distorting on small screens",
                    "zh-Hant": "修正筆記標示圓圈在小螢幕上變形的問題",
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
                    en: "Statistics shows an empty state when no games have been played",
                    "zh-Hant": "尚無遊戲紀錄時，統計會顯示空白狀態",
                },
            },
            {
                text: {
                    en: "Clear All Records button on Statistics with confirmation",
                    "zh-Hant": "統計新增「清除所有紀錄」按鈕，並會先請你確認",
                },
            },
            {
                text: {
                    en: "App version is shown on Settings",
                    "zh-Hant": "設定頁面會顯示 App 版本",
                },
            },
            {
                text: {
                    en: "Clearing a filled cell also clears the same digit from peer notes",
                    "zh-Hant": "清除已填入的格子時，也會一併清除同列、同欄、同宮格筆記中的相同數字",
                },
            },
        ],
    },
];
