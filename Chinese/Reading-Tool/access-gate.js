/**
 * 課文存取密碼門（2026-09-30）
 *
 * 用途：各課課文取自出版社教材，有版權，不宜對外直接公開。這道門讓沒有密碼的
 * 訪客看不到課文內容。
 *
 * 重要限制（請務必知道，不要誤以為這是完整的保護）：
 * 本站是 GitHub Pages 靜態網站，沒有伺服器可以驗證密碼，密碼只能在瀏覽器裡比對。
 * 因此這道門擋得住一般訪客與搜尋引擎，但擋不住懂技術的人——lessons/*.json 仍在
 * 公開的 repo 裡，直接開網址就能取得。若日後需要真正擋住，要改成
 * 「用密碼把課文加密後才放進 repo」，或把整個 repo 改為私有。
 *
 * 設定密碼：在本目錄執行
 *     node set-password.mjs
 * 依提示輸入密碼，它會把 SHA-256 雜湊寫進 access-config.js。
 * 密碼本身不會被寫進任何檔案，也不會進版本控制。
 *
 * 尚未設定密碼時，這道門不會啟用（避免把自己鎖在外面）。
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'reading_tool_access_v1';
    // 解鎖後記住的天數。校內老師共用一組密碼，記太久反而不安全。
    const REMEMBER_DAYS = 30;

    const config = window.ReadingAccessConfig || {};
    const expectedHash = String(config.passwordHash || '').trim().toLowerCase();

    // 尚未設定密碼 → 不啟用，直接放行。
    if (!/^[0-9a-f]{64}$/.test(expectedHash)) {
        window.ReadingAccessGate = { enabled: false, ready: Promise.resolve(true) };
        return;
    }

    async function sha256Hex(text) {
        const bytes = new TextEncoder().encode(text);
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function isUnlocked() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const saved = JSON.parse(raw);
            // 綁住雜湊：密碼換過之後，舊的解鎖紀錄自動失效。
            if (saved.hash !== expectedHash) return false;
            return typeof saved.until === 'number' && Date.now() < saved.until;
        } catch (error) {
            return false;
        }
    }

    function remember() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                hash: expectedHash,
                until: Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000,
            }));
        } catch (error) {
            // 無痕模式等情境不能寫入，仍讓本次瀏覽通過。
        }
    }

    function forget() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* 同上 */ }
    }

    function buildOverlay(resolve) {
        const overlay = document.createElement('div');
        overlay.id = 'reading-access-gate';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', '課文存取密碼');
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'display:flex', 'align-items:center', 'justify-content:center',
            'padding:16px', 'background:#f8fafc',
            'font-family:"Noto Sans TC",system-ui,-apple-system,sans-serif',
        ].join(';');

        overlay.innerHTML = [
            '<div style="width:100%;max-width:380px;background:#fff;border:1px solid #e2e8f0;',
            'border-radius:16px;padding:28px 24px;box-shadow:0 10px 30px rgba(15,23,42,.08)">',
            '<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a">課文點讀小幫手</h1>',
            '<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569">',
            '各課課文取自出版社教材，僅供校內教學使用，請輸入密碼後繼續。</p>',
            '<label for="reading-access-input" style="display:block;font-size:13px;font-weight:700;',
            'color:#334155;margin-bottom:6px">密碼</label>',
            '<input id="reading-access-input" type="password" autocomplete="current-password" ',
            'style="width:100%;box-sizing:border-box;padding:10px 12px;font-size:16px;border:1px solid #cbd5e1;',
            'border-radius:10px;outline:none" />',
            '<p id="reading-access-error" role="alert" style="display:none;margin:10px 0 0;font-size:13px;color:#e11d48"></p>',
            '<button id="reading-access-submit" type="button" style="margin-top:16px;width:100%;padding:11px 12px;',
            'font-size:15px;font-weight:700;color:#fff;background:#0d9488;border:none;border-radius:10px;',
            'cursor:pointer">進入</button>',
            '<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">',
            '密碼請向省三潛能教室老師索取。解鎖後這台裝置會記住 ', String(REMEMBER_DAYS), ' 天。</p>',
            '</div>',
        ].join('');

        const input = overlay.querySelector('#reading-access-input');
        const error = overlay.querySelector('#reading-access-error');
        const submit = overlay.querySelector('#reading-access-submit');

        const showError = message => {
            error.textContent = message;
            error.style.display = 'block';
        };

        let checking = false;
        const attempt = async () => {
            if (checking) return;
            const value = input.value;
            if (!value) { showError('請輸入密碼。'); return; }
            checking = true;
            submit.disabled = true;
            try {
                const actual = await sha256Hex(value);
                if (actual === expectedHash) {
                    remember();
                    overlay.remove();
                    document.documentElement.style.removeProperty('overflow');
                    resolve(true);
                    return;
                }
                showError('密碼不正確，請再試一次。');
                input.select();
            } catch (err) {
                // crypto.subtle 只在 https 或 localhost 可用。
                showError('這個瀏覽器無法驗證密碼，請改用 https 網址開啟。');
            } finally {
                checking = false;
                submit.disabled = false;
            }
        };

        submit.addEventListener('click', attempt);
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') { event.preventDefault(); attempt(); }
        });

        document.documentElement.style.overflow = 'hidden';
        document.body.appendChild(overlay);
        input.focus();
        return overlay;
    }

    let resolveReady;
    const ready = new Promise(resolve => { resolveReady = resolve; });

    function start() {
        if (isUnlocked()) { resolveReady(true); return; }
        buildOverlay(resolveReady);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }

    window.ReadingAccessGate = { enabled: true, ready, lock: forget };
})();
