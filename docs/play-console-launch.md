# Play Console 首次上架清單（v2.0.0）

上傳用的 AAB：`android/app/build/outputs/bundle/release/app-release.aab`
（tag `2.0.0`，versionCode 20000，已用 upload key 簽章）。重新 build 會覆蓋這個檔案，上傳前請先另存一份。

後續每次 release 的流程見 `docs/release.md`。

## 1. 帳號（只需要做一次）

- [x] 開發者帳號為正常狀態（個人帳號）
- [ ] 確認帳號建立日期：如果是 2023-11-13 之後建立，上 Production 前必須先跑封閉測試（見第 8 步）
- [ ] 付款資料（merchant 帳戶）；有這個才能販售 IAP
- [ ] 稅務表單 W-8BEN
- [ ] 收款銀行帳戶
- [ ] Google 帳號已開啟兩步驟驗證

## 2. 建立 app

- [ ] 套件名稱 `io.github.blazer030.sudoku`（發布後不能更改）
- [ ] 名稱 `Sudoku`，預設語言英文，免費
- [ ] 類型選 **Game**，類別選 Puzzle

## 3. App 內容（政策問卷）

- [ ] 隱私權政策網址：`https://blazer030.github.io/sudoku/privacy-policy.html`
- [ ] 廣告：無
- [ ] App 存取權：不需要登入
- [ ] 內容分級問卷（預期結果是 Everyone）
- [ ] 目標對象：不要勾選 13 歲以下，否則會套用 Families 政策
- [ ] Data safety：
  - Firebase Analytics 會收集 app 互動和裝置 ID，不含個人身分資訊
  - 購買由 Google Play 處理，app 不經手付款資料
- [ ] 政府、新聞、健康類標記：都選「否」

## 4. 商店資訊

- [ ] 簡短說明（80 字以內）
- [ ] 完整說明（4000 字以內）
- [ ] App icon 512×512 PNG
- [ ] 主題圖片 1024×500
- [ ] 手機截圖至少 2 張（建議 4–8 張）

## 5. 內部測試

- [ ] 在 Internal testing 建立 release，上傳 `app-release.aab`；第一次上傳時會一併啟用 Play App Signing
- [ ] 加入測試者 email，透過加入連結安裝

## 6. IAP 商品（要先上傳過 AAB 才能建立）

- [ ] 建立 3 個消耗型商品，ID 必須完全一致：
  - [ ] `donate_coffee`：Coffee，$2.99 USD
  - [ ] `donate_lunch`：Lunch，$5.99 USD
  - [ ] `donate_coding_time`：Coding Time，$9.99 USD
- [ ] 3 個商品都設為啟用
- [ ] 設定 → License testing 加入自己的 Gmail

## 7. 實機驗證

- [ ] 正常網路下打開 Donate 頁，直接出現 3 個價位，不會閃過 Retry
- [ ] 開飛航模式，約 10 秒後出現 Retry；恢復網路後按 Retry 能載入
- [ ] 3 個價位都完成一次測試購買，成功畫面和 Done（回到 Settings）都正常
- [ ] 取消付款時出現「Cancelled」toast
- [ ] Firebase DebugView 看得到事件，tier 和金額正確（先執行 `npm run android:debug-firebase`）
- [ ] 開啟 launcher icon 開關後換主題，icon 會跟著切換
- [ ] 設定裡的隱私權政策連結能打開
- [ ] 一般遊戲流程：開新局、完成一局、重開 app 後存檔還在、統計正確

發現問題就走 hotfix 2.0.1（versionCode 會自動變成 20001），上傳到同一個測試軌。

## 8. 上線

在 app 的「資訊主頁」確認是否出現「封閉測試」和「申請正式版存取權」：

**不需要封閉測試**（帳號在 2023-11-13 之前建立）

- [ ] 把內部測試驗證過的 build 直接升到 Production

**需要封閉測試**（帳號在 2023-11-13 之後建立）

- [ ] 把同一個 build 升到封閉測試，邀請至少 12 位測試者，用 Google 帳號加入
- [ ] 測試者連續 14 天持續安裝 app（期間換版本不會讓天數重算）
- [ ] 填寫「申請正式版存取權」問卷，說明測試過程和收到的回饋（審核大約需要幾天）
- [ ] 通過後升到 Production

## 已知但不擋上架的問題

- 快速離開再回到 Donate 頁時，可能短暫出現一張空卡片：`donateStore.loadProducts` 沒有防止同時進行的呼叫
- Play 服務初始化失敗時，這次 app 執行期間按 Retry 都會等 10 秒後失敗。原因是 cdv-purchase 的 `initialize` 重試時拿回同一個卡住的 Promise，屬於函式庫的 bug
