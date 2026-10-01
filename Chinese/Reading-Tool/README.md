# Reading-Tool（注音校訂工具）

> **2026-10-01：課文已移出本目錄。學生用的點讀入口改在「國語課文樂園」。**

## 發生什麼事

`lessons/*.json` 含課文全文。本目錄的 `access-config.js` 密碼門只存密碼的
SHA-256 雜湊、比對過了才顯示畫面——但那些 JSON 是**明碼**放在公開的
GitHub Pages 上，任何人直接開
`https://teacherhsu.github.io/Teaching-Materials/Chinese/Reading-Tool/lessons/<id>.json`
就能拿到整篇課文。密碼門只擋了 UI，沒擋到資料，牴觸 sped-os ADR-0034
「課文全文不放公開 repo」。

處置：

- 明碼正本移到 `~/mandarin-work/reading-tool-lessons/`（不進 repo）。
- 公開站改放 AES-GCM 密文 `apps/mandarin/public/data/readings.enc.json`，
  由 `apps/mandarin/tools/encrypt_readings.py` 產生，PBKDF2-SHA256 導金鑰。
- `lessons/` 已從 git 歷史移除（force push）。
- 學生入口：課文樂園的課次首頁 →「📖 課文點讀」。

## 這個工具還留著做什麼

它仍然是**注音校訂**的工具（`pronunciation-rules.js` 的多音規則、
`tests/` 的稽核、`reviews/` 的校訂紀錄）。要用它校訂課文時：

```bash
# 把明碼課文複製回來（本機用，.gitignore 已擋住，不會被 commit）
cp -R ~/mandarin-work/reading-tool-lessons/ Chinese/Reading-Tool/lessons/
```

校訂完把改動寫回 `~/mandarin-work/reading-tool-lessons/`，再重跑加密器：

```bash
cd apps/mandarin && python3 tools/encrypt_readings.py --password <教室密碼>
```

> 沒有 `lessons/` 時，本目錄的 `index.html` / `lessons.html` 會載入失敗，
> 這是預期行為——學生不該再從這裡進入。
