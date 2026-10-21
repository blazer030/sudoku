import type { AppLocale } from "@/application/SettingsStorage";

export interface ChangelogEntry {
    version: string;
    date: string;
    changes: Record<AppLocale, string[]>;
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "2.1.1",
        date: "2026-10-21",
        changes: {
            en: [
                "Traditional Chinese support; choose the language in Settings",
                "Walkthrough chain lines and gridlines stay aligned on narrow screens",
                "Walkthrough step counter is centered",
                "Game Review keeps the full history after you leave and resume a game",
                "Games abandoned by starting a new one can now be reviewed in Statistics",
                "Changing the launcher icon no longer closes the app; the new icon appears after you leave it (App)",
            ],
            "zh-Hant": [
                "支援繁體中文，可在設定中切換語言",
                "修正解題演示在窄螢幕上連線與格線對不齊的問題",
                "解題演示的步數改為置中",
                "離開後再繼續的遊戲，遊戲回顧會保留完整紀錄",
                "因開始新遊戲而放棄的遊戲，也能在統計中回顧",
                "更換 App 圖示時不會再直接關閉 App，離開 App 後就會換成新圖示（App）",
            ],
        },
    },
    {
        version: "2.0.0",
        date: "2026-10-21",
        changes: {
            en: [
                "First app release",
                "Launcher icon can match the selected color theme (App)",
            ],
            "zh-Hant": [
                "首次推出 App 版本",
                "App 圖示可配合所選的色彩主題（App）",
            ],
        },
    },
    {
        version: "1.6.0",
        date: "2026-04-20",
        changes: {
            en: [
                "New solver techniques: X-Chain and XY-Chain",
                "Walkthrough visualizes chain links over the board",
                "Added a Changelog page accessible from Settings",
            ],
            "zh-Hant": [
                "新增解題技巧：X 鏈與 XY 鏈",
                "解題演示會在盤面上標示鏈的連結",
                "新增更新日誌頁面，可從設定進入",
            ],
        },
    },
    {
        version: "1.5.1",
        date: "2026-04-20",
        changes: {
            en: [
                "Fixed Walkthrough showing playback controls before solving starts",
            ],
            "zh-Hant": [
                "修正解題演示在開始解題前就顯示播放控制的問題",
            ],
        },
    },
    {
        version: "1.5.0",
        date: "2026-04-20",
        changes: {
            en: [
                "Added Solver Walkthrough page for entering puzzles and watching them solved step by step",
                "Hint now displays the name of the solving technique used",
                "New solver techniques: X-Wing, Swordfish, Jellyfish, XY-Wing, W-Wing, XYZ-Wing, WXYZ-Wing",
                "Puzzle generation enforces difficulty against the techniques required to solve",
            ],
            "zh-Hant": [
                "新增解題演示頁面，可輸入題目並逐步觀看解題過程",
                "提示現在會顯示所用的解題技巧名稱",
                "新增解題技巧：X-Wing、Swordfish、Jellyfish、XY-Wing、W-Wing、XYZ-Wing、WXYZ-Wing",
                "出題時會依解題所需的技巧來控制難度",
            ],
        },
    },
    {
        version: "1.4.0",
        date: "2026-04-16",
        changes: {
            en: [
                "Added Game Review to replay completed games (open from Statistics)",
                "Smoother playback controls with a draggable progress bar",
                "Sticky headers when scrolling Settings and Game Review",
            ],
            "zh-Hant": [
                "新增遊戲回顧，可重播已完成的遊戲（從統計進入）",
                "播放控制更順暢，並新增可拖曳的進度條",
                "捲動設定與遊戲回顧時，標題列會固定在頂端",
            ],
        },
    },
    {
        version: "1.3.1",
        date: "2026-04-13",
        changes: {
            en: [
                "Fixed a game interaction bug",
            ],
            "zh-Hant": [
                "修正一個遊戲操作的問題",
            ],
        },
    },
    {
        version: "1.3.0",
        date: "2026-04-13",
        changes: {
            en: [
                "Fireworks effect when completing a game",
                "Each color theme ships its own app icon and PWA manifest",
                "Settings page restyled with a sectioned card layout",
            ],
            "zh-Hant": [
                "完成遊戲時顯示煙火效果",
                "每個色彩主題都有專屬的 App 圖示與 PWA 資訊清單",
                "設定頁面改用分區卡片版面",
            ],
        },
    },
    {
        version: "1.2.0",
        date: "2026-04-08",
        changes: {
            en: [
                "Redesigned Settings page with 6 color themes and gameplay toggles",
                "App accent color follows the selected theme",
                "Ripple animation when completing a row, column, or box",
                "Smoother modal and hint popup transitions",
            ],
            "zh-Hant": [
                "重新設計設定頁面，提供 6 種色彩主題與遊戲選項開關",
                "App 強調色會跟隨所選主題",
                "完成一列、一欄或一個九宮格時顯示漣漪動畫",
                "對話框與提示彈出視窗的轉場更順暢",
            ],
        },
    },
    {
        version: "1.1.1",
        date: "2026-04-07",
        changes: {
            en: [
                "Fixed note highlight circles distorting on small screens",
            ],
            "zh-Hant": [
                "修正筆記標示圓圈在小螢幕上變形的問題",
            ],
        },
    },
    {
        version: "1.1.0",
        date: "2026-04-07",
        changes: {
            en: [
                "Statistics shows an empty state when no games have been played",
                "Clear All Records button on Statistics with confirmation",
                "App version is shown on Settings",
                "Clearing a filled cell also clears the same digit from peer notes",
            ],
            "zh-Hant": [
                "尚無遊戲紀錄時，統計會顯示空白狀態",
                "統計新增「清除所有紀錄」按鈕，並會先請你確認",
                "設定頁面會顯示 App 版本",
                "清除已填入的格子時，也會一併清除同列、同欄、同宮格筆記中的相同數字",
            ],
        },
    },
];
