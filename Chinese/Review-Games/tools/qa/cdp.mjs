// 用 DevTools 協定開頁、執行操作腳本、截圖。用法：node cdp.mjs <url> <out.png> <script.js>
// QA 截圖工具：用無頭 Chrome 開遊戲、模擬遊玩、截圖（強制關閉減少動態，才看得到 3D）。
// RM=reduce 可模擬系統「減少動態」。
// 用法：node tools/qa/cdp.mjs <url> <out.png> tools/qa/play-monopoly.js（需本機 http://localhost:5190 靜態伺服器）
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [url, out, scriptFile] = process.argv.slice(2);
const qaURL = new URL(url);
const width = Number(qaURL.searchParams.get('qaWidth')) || 1366;
const height = Number(qaURL.searchParams.get('qaHeight')) || 900;
// 埠被殘留的 Chrome 占住時，新開的 Chrome 綁不到埠，會連到舊實例（舊 localStorage／模擬設定），一律先擋下。
try { await fetch('http://127.0.0.1:9333/json/version'); throw new Error('PORT_BUSY'); } catch (e) { if (e.message === 'PORT_BUSY') throw new Error('9333 埠已有殘留的 Chrome，請先 pkill -f remote-debugging-port=9333'); }
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9333', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--window-size=${width},${height}`, `--user-data-dir=${tmpdir()}/rg-cdp-profile`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); if (targets.length) break; } catch {} await sleep(250); }
if (!targets?.length) { chrome.kill(); throw new Error('Chrome 除錯埠 9333 無法連線，未產生截圖；請檢查 Chrome 啟動權限。'); }
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.onopen = r);
let id = 0; const pending = {}; const logs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; } if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + d.params.exceptionDetails.exception?.description?.slice(0, 200)); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push('ERR ' + JSON.stringify(d.params.args.map(a => a.value ?? a.description)).slice(0, 200)); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
// 停用快取：profile 目錄會沿用，不關快取會截到改版前的舊檔。
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: process.env.RM || 'no-preference' }] });
await send('Page.navigate', { url }); await sleep(4000);
const script = scriptFile ? readFileSync(scriptFile, 'utf8') : '1';
const r = await send('Runtime.evaluate', { expression: `(async()=>{${script}})()`, awaitPromise: true, returnByValue: true });
console.log('RESULT', JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(logs.join('\n'));
ws.close(); chrome.kill('SIGKILL'); await sleep(300);
