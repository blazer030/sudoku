# 多語系（繁體中文 + 英文）設計

## 背景與目的

2.0.0 已發布，Google Play 尚未正式上架。主要市場是台灣，商店頁已經準備好中英兩種文案，但 app 介面目前全是英文。

目標畫面：**台灣玩家下載後，不用做任何設定，打開就是中文。**

這次要跟 develop 上已完成、還沒發布的變更一起出 **2.1.0**：
- 隱私權政策更新（聯絡信箱、對齊 Data safety 宣告）
- Walkthrough 的兩個修正：連線對齊格子中心、格線高低一致

## 目標

- App 支援兩種語言：**繁體中文**、**英文**。
- 預設跟隨系統語言：系統是繁體中文時顯示中文，其他任何語言（包括簡體中文）一律顯示英文，等之後真的加入該語言再說。
- 設定頁新增語言選項：跟隨系統（預設）／English／繁體中文。
- 切換語言**立即生效**，不用重開 app。
- 網頁版（GitHub Pages）與 Android 版行為一致；網頁版的「系統語言」指瀏覽器語言。
- Android 桌面名稱：中文手機顯示「數獨」，其他語言顯示「Sudoku」。
- 更新日誌全部翻成中文，之後每次發版都寫中英兩份；畫面上只顯示目前語言的那一份。

## 非目標

- 隱私權政策維持英文版，不翻譯（使用者決定：玩家幾乎不會看，也不影響遊戲）。
- 其他語言（簡體中文、日文……）。
- PWA manifest 的 app 名稱與說明維持英文：manifest 不支援依語言切換，維持現狀。
- Google Play 商店文案：已另外準備好，不屬於這次的程式工作。
- 商店的中文截圖：等這版完成後再用中文介面重截，不屬於這次的程式工作。

## 反目標（技術上能動，但這樣就算失敗）

- 有任何畫面在中文下還殘留英文 UI 文字（技巧名稱中刻意保留英文的除外，見術語表）。
- 切換語言後要重開 app、或某些畫面要離開再進來才會更新。
- 翻譯後的文字流進資料層：Analytics 事件參數、`data-testid`、存檔或統計紀錄裡都只能有 id，不能有顯示文字。
- 中文以簡體或日文字形顯示（同一個漢字在不同語系字型的寫法不同）。
- 中文版面跑版：按鈕文字被截斷、彈出視窗撐破、標題換行錯位。
- 既有測試因為加入多語系而大量改寫英文斷言；英文行為應該維持原樣。

## 已決定事項

| 主題 | 決定 | 來源 |
|---|---|---|
| 語言 | 繁體中文、英文 | 使用者 |
| 預設 | 跟隨系統；非繁中一律英文 | 使用者 |
| 手動切換 | 設定頁：跟隨系統／English／繁體中文 | 使用者 |
| 生效時機 | 立即生效，不重開 | 使用者 |
| 網頁版 | 一起套用，依瀏覽器語言 | 使用者 |
| 技巧名稱 | 基礎技巧用中文；Wing 與魚形用英文；鏈叫「X 鏈」「XY 鏈」 | 使用者 |
| 更新日誌 | 全部翻譯，之後中英各寫一份，只顯示目前語言 | 使用者 |
| 隱私權政策 | 只留英文 | 使用者 |
| 桌面名稱 | 中文「數獨」，其他「Sudoku」 | 使用者 |
| 版本 | 2.1.0，含版本記錄 | 使用者 |
| 格子位置的說法 | row = 列、column = 欄（「第 r 列第 c 欄」） | 使用者 |
| Android 實機檢查 | 交給在 Android Studio 開著本專案 `android/` 的另一個 Claude session | 使用者 |

## 設計

以下除了「已決定事項」之外，都是**我的決定**（標 ⚙︎），實作者可以在不改變上述行為的前提下調整。

### 1. 函式庫 ⚙︎

使用 **vue-i18n**（v11，Composition API 模式，`legacy: false`）。理由：
- Vue 3 的標準解法，`locale` 是響應式的，改了之後所有 `t()` 自動更新，直接滿足「立即生效」。
- 內建 `<i18n-t>` 元件插槽，可以處理「數字要加粗、但語序因語言而異」的句子（對局回顧）。

語言代碼用 `en` 與 `zh-Hant`。

### 2. 語言判斷 ⚙︎

- 設定值 `language: "system" | "en" | "zh-Hant"`，預設 `"system"`。
- `"system"` 時依 `navigator.languages`（沒有則 `navigator.language`）判斷：
  - 第一個語言是 `zh-Hant*`、`zh-TW`、`zh-HK`、`zh-MO` → `zh-Hant`。
  - 其他（含 `zh-CN`、`zh-Hans`、`zh-SG`、單獨的 `zh`）→ `en`。單獨的 `zh` 在實務上多半是簡體環境，歸為英文。
  - 只看清單中的第一個語言，不往後找；這符合「跟著手機語言」的直覺。
- 設定是 `"system"` 時監聽 `window` 的 `languagechange` 事件並重新判斷。Android 的 `MainActivity` 在系統語言變更時不會重建（`configChanges` 含 `locale`），所以要靠這個事件；若 WebView 沒有送出此事件，下次冷啟動也會更正，可以接受。
- 判斷結果寫到 `i18n.global.locale`，同時設定 `document.documentElement.lang`（`zh-Hant` 或 `en`），讓瀏覽器選對字形。
- 語言在 app mount 之前就決定好，第一個畫面不會閃英文。設定已經是同步讀取 `localStorage`，可以直接用。

### 3. 設定儲存

- `Settings` 型別新增 `language` 欄位，存在既有的 `localStorage` key `sudoku-settings`。`loadSettings()` 會與預設值合併，舊資料不受影響。
- `settingsStore` 新增 `language` ref 與 `setLanguage()`；注意 `persistAll()` 是逐欄列出，要一起加。

### 4. 設定頁 UI ⚙︎

- 在 Appearance 區塊之前新增 **Language／語言** 區塊，內含三個選項的分段切換：跟隨系統／English／繁體中文。
- 「跟隨系統」這個選項跟著目前語言翻譯；「English」與「繁體中文」永遠用該語言自己的寫法顯示，讓看不懂目前語言的人也找得到。
- 樣式可參考首頁的 `DifficultySwitcher`。

### 5. 翻譯檔結構 ⚙︎

- `src/presentation/i18n/` 底下放 `en.ts`、`zh-Hant.ts` 與建立 i18n 實例的程式。用 TypeScript 物件，並以英文檔的型別約束中文檔，缺 key 就編譯失敗。
- key 依畫面分組（`home.*`、`game.*`、`settings.*`……）。
- 測試環境（`src/__tests__/setup.ts`）全域安裝 i18n 並固定為 `en`，既有的英文斷言維持不變。

### 6. 需要特別處理的文字

| 項目 | 現況 | 做法 ⚙︎ |
|---|---|---|
| 「Row r, Col c = v」 | 在提示 toast、Walkthrough、對局回顧三處各自拼接 | 統一成一個帶參數的訊息。中文：「第 r 列第 c 欄 = v」 |
| 「Step n of m」 | `ProgressBar` | 帶參數訊息。中文：「第 n 步／共 m 步」 |
| 「1 elimination / n eliminations」 | Walkthrough，唯一的複數 | 英文用 vue-i18n 複數；中文：「刪去 n 個候選數」 |
| 對局回顧的描述 | 用片段陣列拼接，數字加粗 | 改用 `<i18n-t>` 加插槽，讓各語言自己決定語序，數字仍加粗 |
| 「Thank you for the {label}!」 | 贊助成功頁 | 三個等級各寫一句完整的話，不用填空。例如「謝謝你請我喝咖啡！」 |
| 贊助頁說明裡的 `<br>` | 寫在模板裡 | 拆成兩段文字 |
| 日期 | `formatDate` 寫死 `en-US`，含 Today／Yesterday | 依目前語言輸出。英文維持現狀（「Today, 3:05 PM」「Oct 21, 3:05 PM」）。中文用斜線日期加 24 小時制，不用「10月21日」「下午」：「今天 15:05」「昨天 09:12」「10/21 15:05」（使用者決定；小時補零是我的決定 ⚙︎）。跨年的日期跟現在一樣不顯示年份 |
| 難度名稱 | `DifficultyLabels` 放在 domain 層，統計頁又寫死一份，遊戲頁標頭不是響應式 | 移到 `presentation/labels` 改用翻譯 key；domain 只留 id。這一步先做成純結構調整（Tidy First），再接翻譯 |
| 贊助等級名稱 | `PlayBillingAdapter`、`NoopBillingAdapter`、`DonateSuccess` 三處各一份 | 畫面依等級 id 查翻譯；`Product.label` 拿掉或不再用於顯示 |
| PuzzleLoader 預設訊息 | prop 預設值 | 呼叫端傳入翻譯後的文字，或在元件內用 computed |

價格（`priceText`）由 Google Play 依使用者帳號在地化，**不翻譯**。

### 7. 更新日誌

- `ChangelogEntry.changes` 改成依語言分開：`changes: { en: string[]; "zh-Hant": string[] }`。用型別強制兩種語言都要有。
- 畫面只顯示目前語言那一份。
- 既有 10 個版本、26 條全部翻譯；條目中提到的技巧與 UI 名稱要對齊術語表與介面上的實際翻譯。
- `docs/release.md` 的「Update the changelog」步驟改成要求中英兩份。

### 8. 字型與排版 ⚙︎

- 字型堆疊在 Outfit 之後補上繁中字型：`"Outfit", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`。不另外下載網路字型，用系統內建的即可（Android 內建 Noto Sans CJK，搭配 `lang="zh-Hant"` 會選繁體字形）。等寬字型（`font-mono`）同理。
- 中文時，`uppercase` 與較寬的 `tracking-*` 對中文沒有意義且會讓字距怪異；在 `:lang(zh-Hant)` 下取消字距調整。
- 要實際檢查的固定寬度處：提示選單（`w-55`）、完成視窗的難度欄（`text-[32px]` 的三欄）、各頁標頭用來平衡「Back」按鈕寬度的佔位元素。

### 9. Android 桌面名稱

- 新增 `android/app/src/main/res/values-zh-rTW/strings.xml`，把 `app_name` 與 `title_activity_main` 設為「數獨」。所有主題的 activity-alias 都引用 `title_activity_main`，所以一次全部生效。
- 也加 `values-zh-rHK`，讓香港繁中手機一樣顯示「數獨」，與 app 內的判斷一致。⚙︎
- `package_name`、`custom_url_scheme` 不放進翻譯檔。
- 已知限制：桌面名稱由 **系統語言** 決定，不受 app 內語言切換影響。這是 Android 的行為，使用者已知情。

### 10. 不翻譯的東西

- Analytics 事件名稱與參數：已經是 id（`easy`、`reveal_cell`、`coffee`……），維持。
- `data-testid`：維持英文 id。Walkthrough 測試題目的標籤（Singles／Medium／Hard）用來組 `data-testid`，而且只在開發用功能旗標下出現，**不翻譯**。
- `console.error` 等開發者訊息。
- 隱私權政策頁面。

## 術語表（繁體中文）

技巧名稱：基礎技巧為我依使用者寫的商店文案延伸 ⚙︎，Wing／魚形／鏈依使用者決定。

| id | English | 繁體中文 |
|---|---|---|
| nakedSingle | Naked Single | 唯一候選數 |
| hiddenSingle | Hidden Single | 隱藏唯一數 |
| nakedPair | Naked Pair | 顯性數對 |
| nakedTriple | Naked Triple | 顯性三數組 |
| nakedQuad | Naked Quad | 顯性四數組 |
| hiddenPair | Hidden Pair | 隱性數對 |
| hiddenTriple | Hidden Triple | 隱性三數組 |
| hiddenQuad | Hidden Quad | 隱性四數組 |
| pointing | Pointing | 宮區塊摒除 |
| claiming | Claiming | 行列區塊摒除 |
| xWing | X-Wing | X-Wing |
| swordfish | Swordfish | Swordfish |
| jellyfish | Jellyfish | Jellyfish |
| xyWing | XY-Wing | XY-Wing |
| wWing | W-Wing | W-Wing |
| xyzWing | XYZ-Wing | XYZ-Wing |
| wxyzWing | WXYZ-Wing | WXYZ-Wing |
| xChain | X-Chain | X 鏈 |
| xyChain | XY-Chain | XY 鏈 |

其他固定用語：

| English | 繁體中文 |
|---|---|
| Easy / Medium / Hard | 簡單／中等／困難 |
| Auto Notes | 自動筆記 |
| Check Conflicts / Check Errors | 檢查衝突／檢查錯誤 |
| Reveal Cell | 揭示一格 |
| Walkthrough | 解題演示 |
| Statistics | 統計 |
| Settings | 設定 |
| Changelog | 更新日誌 |
| Donate / Support | 贊助／支持開發 |
| Row r, Col c | 第 r 列第 c 欄 |

row 用「列」（橫）、column 用「欄」（直），跟 Excel 一樣，避免「行／列」在台灣與對岸用法相反造成誤會。（使用者決定）

## 測試

- 依專案 TDD 慣例逐步進行；既有測試在 `en` 下維持綠燈。
- 新增測試至少涵蓋：
  - 語言判斷：各種 `navigator.languages` 組合對應到正確語言，包括 `zh-CN` → `en`、`zh-HK` → `zh-Hant`。
  - 設定：預設 `system`、切換後寫入 `localStorage`、重新載入後還在；`SettingsStorage` 既有的預設值完整比對要更新。
  - 立即生效：在掛載中的頁面切換語言，文字隨即更新。
  - 中文抽樣：每個主要畫面至少一個中文斷言，包括上面「需要特別處理的文字」每一項。
  - `formatDate` 在兩種語言下的輸出（目前沒有任何測試）。
  - 翻譯完整性：靠型別保證中文檔沒有缺 key。
- 實際在瀏覽器以 360dp 寬度檢查中文版面（字型、換行、固定寬度處）。
- Android 實機檢查：交給在 Android Studio 開著 `android/` 的另一個 Claude session，用開發版（`npm run android:run` 或 `android:build:dev`）安裝後確認：
  - 中文手機的桌面名稱是「數獨」，英文手機是「Sudoku」
  - app 開著時切換系統語言，設定為「跟隨系統」的畫面立即跟著變（若 WebView 沒有送出 `languagechange`，至少冷啟動後要正確）
  - 中文以繁體字形顯示
  - 設定頁手動切換語言立即生效

## 發版

- 依 `docs/release.md` 用 git flow 開 `release/2.1.0`，在 release 分支上把版本改成 2.1.0。
- **計畫停在 release 分支準備好的狀態。** `git flow release finish` 與推送會立即部署網頁版，必須等使用者明確同意才執行。
- 2.1.0 的更新日誌（中英各一份）至少包含：
  - 支援繁體中文，可在設定中切換語言
  - Walkthrough 的連線與格線在窄螢幕上的對齊修正
- 發版後：重建 AAB、用中文介面重截商店截圖（不屬於這份設計的程式範圍）。

## 交給實作者決定

- 翻譯 key 的命名與分組細節。
- 中文文案的實際字句（術語表以外），以自然、簡短的台灣用語為準。
- 語言區塊在設定頁的確切樣式。
- 實作順序；建議先做結構調整（難度名稱搬出 domain、統一「第 r 列第 c 欄」的組字），再裝 i18n、逐頁翻譯，最後是更新日誌與 Android 資源。
