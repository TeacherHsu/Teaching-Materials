// 用 DevTools 協定開頁、執行操作腳本、截圖。用法：node cdp.mjs <url> <out.png> <script.js>
// QA 截圖工具：用無頭 Chrome 開遊戲、模擬遊玩、截圖（強制關閉減少動態，才看得到 3D）。
// 用法：node tools/qa/cdp.mjs <url> <out.png> tools/qa/play-monopoly.js（需本機 http://localhost:5190 靜態伺服器）
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [url, out, scriptFile] = process.argv.slice(2);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9333', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1366,900', `--user-data-dir=${tmpdir()}/rg-cdp-profile`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); if (targets.length) break; } catch {} await sleep(250); }
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.onopen = r);
let id = 0; const pending = {}; const logs = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; } if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + d.params.exceptionDetails.exception?.description?.slice(0, 200)); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push('ERR ' + JSON.stringify(d.params.args.map(a => a.value ?? a.description)).slice(0, 200)); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await send('Page.navigate', { url }); await sleep(4000);
const script = scriptFile ? readFileSync(scriptFile, 'utf8') : '1';
const r = await send('Runtime.evaluate', { expression: `(async()=>{${script}})()`, awaitPromise: true, returnByValue: true });
console.log('RESULT', JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(logs.join('\n'));
ws.close(); chrome.kill();
