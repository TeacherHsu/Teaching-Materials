/**
 * 課文存取密碼設定（2026-09-30）
 *
 * passwordHash 放的是密碼的 SHA-256 雜湊，不是密碼本身。
 * 要設定或更換密碼，在本目錄執行：
 *     node set-password.mjs
 *
 * 留空字串 = 不啟用密碼門（目前狀態）。
 */
window.ReadingAccessConfig = {
    passwordHash: '42129c6b2becb3a23ac4c92e5881b256fbb55b43e9b48a3c28c4be2fbc86e373',
};
