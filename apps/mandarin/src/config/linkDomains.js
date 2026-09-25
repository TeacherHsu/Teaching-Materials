// 延伸練習外連網域白名單。validate-data.mjs（build-time schema 檢查）與前端
// ExtensionLinks 元件共用同一份清單，避免兩處各自維護導致漂移。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md「延伸練習連結」一節。
export const ALLOWED_LINK_DOMAINS = [
  'wordwall.net',
  'dict.idioms.moe.edu.tw',
  'dict.revised.moe.edu.tw',
  'dict.concised.moe.edu.tw',
  'pedia.cloud.edu.tw',
  'www.junyiacademy.org',
  'www.pagamo.org',
  'learningapps.org',
  'quizlet.com',
  'www.youtube.com',
  'youtu.be',
  'docs.google.com',
  'xiaoxue.iis.sinica.edu.tw',
  'dict.variants.moe.edu.tw',
  'www.naer.edu.tw',
  'gsyan888.blogspot.com',
  'gsyan888.github.io',
  'www.se365edu.com',
  'stroke-order.learningweb.moe.edu.tw',
];

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isAllowedLinkUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  try {
    const { hostname } = new URL(url);
    return ALLOWED_LINK_DOMAINS.includes(hostname);
  } catch {
    return false;
  }
}
