// 教室密碼：課文全文的解鎖與金鑰保管。
//
// 為什麼要真加密，而不是比對密碼雜湊：
//   舊的 Chinese/Reading-Tool 把密碼的 SHA-256 存在 access-config.js，比對過了
//   才顯示畫面——但課文 JSON 是明碼放在公開 GitHub Pages 上，任何人直接開
//   .../lessons/115HG2A01.json 就拿到整篇課文。密碼門只擋了 UI，沒擋到資料。
//   現在課文全文只以 AES-GCM 密文存在 public/data/readings.enc.json，
//   密碼經 PBKDF2-SHA256 導出金鑰才解得開；密碼不對就只是解密失敗，
//   伺服器上永遠沒有明碼。密文由 tools/encrypt_readings.py 產生。
//
// 解開後把 raw key（不是密碼）存進 localStorage，所以同一台載具下次免輸入；
// 教師頁可以「鎖上」，清掉金鑰並把已解開的課文從記憶體移除。
//
// 這裡不存任何學生姓名或個人資料。
const KEY_STORE = 'mandarin:classroom-key:v1';
const ENC_URL = 'data/readings.enc.json';

/** 已解開的課文，課次代號 → {title, paras}。鎖上時會被清空。 */
const readings = new Map();

let encPromise = null;
let manifest = null;

/**
 * crypto.subtle 只在 https 或 localhost 存在。
 * 學校若用 http 內網開站會解不開，要讓教師看到明確原因，不是默默失敗。
 */
export function cryptoAvailable() {
  return typeof globalThis.crypto?.subtle?.deriveKey === 'function';
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** 讀密文檔（只讀一次，之後共用同一個 promise）。 */
// 換密碼後要重新加密：載具若還留著舊的密文（瀏覽器快取），新密碼會一直被說「不對」。
// 所以一律向伺服器確認（no-cache）；解密失敗時再強制重抓一次（reload）才判定密碼錯。
function loadEnvelope(base = import.meta.env?.BASE_URL || '/', fresh = false) {
  if (fresh) encPromise = null;
  if (!encPromise) {
    encPromise = fetch(`${base.replace(/\/$/, '')}/${ENC_URL}`, { cache: fresh ? 'reload' : 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`readings.enc.json 讀取失敗（HTTP ${res.status}）`);
        return res.json();
      })
      .then((env) => {
        manifest = env;
        return env;
      })
      .catch((err) => {
        encPromise = null; // 允許重試（例如網路斷了又回來）
        throw err;
      });
  }
  return encPromise;
}

/** 這一冊這一課有沒有課文可讀（不需要先解鎖就能問）。 */
export async function hasReading(lessonId) {
  if (readings.has(lessonId)) return true;
  try {
    const env = await loadEnvelope();
    return Array.isArray(env.lessons) && env.lessons.includes(lessonId);
  } catch {
    return false;
  }
}

/** 已經解鎖了嗎。 */
export function isUnlocked() {
  return readings.size > 0;
}

/** 解鎖後的課文；沒解鎖或沒這一課時回 null。 */
export function getReading(lessonId) {
  return readings.get(lessonId) || null;
}

async function decryptWith(key, env) {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(env.iv) },
    key,
    fromBase64(env.data),
  );
  const parsed = JSON.parse(new TextDecoder().decode(plain));
  Object.entries(parsed).forEach(([lessonId, value]) => readings.set(lessonId, value));
  return key;
}

/**
 * 用教室密碼解鎖，成功後把金鑰記在這台載具。
 * @returns {Promise<void>} 密碼不對會 reject（AES-GCM 驗證失敗）。
 */
export async function unlockWithPassword(rawPassword) {
  if (!cryptoAvailable()) throw new Error('這個瀏覽器不支援解鎖');
  // 中文輸入法可能打出全形數字（１２３４），先轉成半形
  const password = String(rawPassword).normalize('NFKC').trim();
  try {
    await unlockOnce(password, await loadEnvelope());
  } catch {
    await unlockOnce(password, await loadEnvelope(undefined, true));
  }
}

async function unlockOnce(password, env) {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(env.salt),
      iterations: env.iter,
      hash: 'SHA-256',
    },
    base,
    { name: 'AES-GCM', length: 256 },
    true, // 要能 exportKey 才記得住
    ['decrypt'],
  );
  await decryptWith(key, env);
  try {
    const raw = await crypto.subtle.exportKey('raw', key);
    window.localStorage.setItem(KEY_STORE, toBase64(raw));
  } catch {
    // 私密瀏覽等情況記不住：這次仍然可用，下次再輸入一次。
  }
}

/**
 * 用這台載具記住的金鑰解鎖（開站時試一次）。
 * @returns {Promise<boolean>} 有沒有成功解開。
 */
export async function unlockFromStore() {
  if (!cryptoAvailable()) return false;
  let raw = null;
  try {
    raw = window.localStorage.getItem(KEY_STORE);
  } catch {
    return false;
  }
  if (!raw) return false;
  try {
    const env = await loadEnvelope();
    const key = await crypto.subtle.importKey('raw', fromBase64(raw), { name: 'AES-GCM' }, false, [
      'decrypt',
    ]);
    await decryptWith(key, env);
    return true;
  } catch {
    // 金鑰壞了或密碼換過了：丟掉，讓教師重新輸入。
    try {
      window.localStorage.removeItem(KEY_STORE);
    } catch {
      /* 同上 */
    }
    return false;
  }
}

/** 鎖上：丟掉金鑰，並把已解開的課文從記憶體清掉。 */
export function lock() {
  try {
    window.localStorage.removeItem(KEY_STORE);
  } catch {
    /* 讀不到 localStorage 時也要清掉記憶體裡的 */
  }
  readings.clear();
}

/** 密文檔的 manifest（課次清單等），還沒載入時回 null。測試與教師頁用。 */
export function envelopeManifest() {
  return manifest;
}
