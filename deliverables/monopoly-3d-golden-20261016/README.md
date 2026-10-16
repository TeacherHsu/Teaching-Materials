# 課文樂園｜大富翁微縮桌遊視覺樣板

## 比較畫面

- `baseline-desktop.png`：改造前，1266 × 700。
- `after-desktop.png`：改造後，同為 1266 × 700；固定斜上方視角。
- `after-mobile-390.png`：改造後，390 × 844；整張棋盤、擲骰按鈕與目前輪次均可見。
- `before-label-refinement-desktop.png`／`before-label-refinement-mobile-390.png`：本輪標籤微調前的畫面，用於局部比較。

## 實作範圍

只改大富翁的場景分支、樣式、版本快取碼與 QA 截圖工具。沒有改題庫、價格、骰子規則、回合、問答或得分邏輯，也沒有改其他遊戲。實際瀏覽器測試已擲骰、開啟 2D 題目、答對、買地並回到下一隊。

手工加入雙層木框、黃銅飾邊、布面與毛氈程序紋理、閱讀小屋，以及書本、鉛筆、檯燈組成的中央微縮閱讀角；棋子有分層底座、柔化接觸陰影與落地彈跳。格名依投影後的格距縮放，視覺使用短標籤，完整名稱仍保留在無障礙標籤。棋子、場景與材質都由原生 Three.js 幾何和 Canvas 程序紋理繪製，沒有引入外部模型、圖片或材質檔。

本輪將課次標籤改為透明底灰字，中央「課文探險」改為白字透明底；移除棋盤 0–19 格號，起點上方加向右箭頭。移動時只在走過的格子逐步顯示隊伍色步數，落在課次地時以黑色粗體顯示完整課名；下一隊開始移動時清除上一段足跡。

## 參考技術

- [monopoly-3d](https://github.com/haskaomni/monopoly-3d) 與 [MonopolyClone](https://github.com/Bizangel/MonopolyClone)：參考完整棋盤的場景組織與資料／視覺／介面分層；未複製程式或資產，沒有引入 React、R3F 或新套件。
- [Lullaby City](https://pmndrs.github.io/examples/lulaby-city/)：參考微縮比例與場景群組的構圖。
- [Room with Soft Shadows](https://pmndrs.github.io/examples/room-with-soft-shadows/) 與 [Three.js contact shadow](https://threejs.org/examples/webgl_shadow_contact.html)：參考柔和棚燈和物件貼地陰影。手機改用單張徑向透明紋理，沒有即時陰影貼圖或多次模糊。
- [Drei Stage](https://drei.docs.pmnd.rs/staging/stage)：參考棚拍光線和環境層次；沿用原 renderer 的燈光實作，沒有安裝 Drei。
- [RoundedBoxGeometry](https://threejs.org/docs/pages/RoundedBoxGeometry.html)：採用圓角盒子的造型概念，直接沿用專案既有的圓角 ExtrudeGeometry helper。
- [PresentationControls](https://drei.docs.pmnd.rs/controls/presentation-controls)：參考受限展示視角；本樣板固定相機並自動取景，讓手機不需拖曳就能看到整盤。

## 授權與效能

目前沒有需要確認授權的外部素材。上述連結僅作技術參考；未複製其程式碼或圖像。若日後採用參考專案的模型、貼圖或其他資產，須另核對資產本身的授權和來源。原頁面已使用 Three.js r128 CDN；這次沒有新增套件、CDN 或圖片下載。

手機模式把 DPR 限為 1，關閉即時陰影貼圖與 PMREM 環境預處理，使用低面數幾何和 512 × 512 程序紋理。桌面沿用原有即時陰影設定。沒有量測實機 GPU 幀時間；已確認 390px 與 375px 無水平溢出、格名互不重疊，renderer 的慢幀降級仍可回到 2D。

未 push、未部署。
