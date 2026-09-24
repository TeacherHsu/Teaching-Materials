// 極簡 hash router：避免 GitHub Pages 深連結 404（# 之後不會送到伺服器，
// 直接分享／重新整理任何頁面都不會 404）。仍搭配 public/404.html
// 處理使用者打錯「真實路徑」的情況。

const routes = [];

/**
 * @param {RegExp} pattern 需含具名群組，例如 /^\/lesson\/(?<lessonId>[^/]+)$/
 * @param {(params: Record<string,string>) => Promise<void> | void} handler
 */
export function route(pattern, handler) {
  routes.push({ pattern, handler });
}

function currentPath() {
  const hash = window.location.hash || '#/';
  return hash.slice(1) || '/';
}

async function resolve() {
  const path = currentPath();
  for (const { pattern, handler } of routes) {
    const match = path.match(pattern);
    if (match) {
      await handler(match.groups || {});
      return;
    }
  }
}

// 注意：呼叫順序即比對順序，notFoundRoute 必須最後註冊，
// 否則它的萬用樣式會蓋掉其後註冊的具體路由。
export function notFoundRoute(handler) {
  routes.push({ pattern: /.*/, handler });
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  window.addEventListener('DOMContentLoaded', resolve);
  if (document.readyState !== 'loading') resolve();
}

export function navigate(path) {
  window.location.hash = `#${path}`;
}
