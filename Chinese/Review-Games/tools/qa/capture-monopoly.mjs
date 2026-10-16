import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const [url, output, widthArg = '1266', heightArg = '700', fullPageArg = 'false', mobileArg = 'auto', ownerFixtureArg = 'false'] = process.argv.slice(2);
if (!url || !output) throw new Error('Usage: node capture-monopoly.mjs <url> <out.png> [width] [height] [fullPage] [mobileEmulation] [ownerFixture]');

const width = Number(widthArg), height = Number(heightArg), mobile = mobileArg === 'false' ? false : mobileArg === 'true' ? true : width <= 760;
const port = 9400 + (process.pid % 500);
const profile = `${tmpdir()}/monopoly-capture-${process.pid}`;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const localG3ABank = readFileSync(new URL('../../data/G3A.js', import.meta.url)).toString('base64');
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-extensions',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--window-size=${width},${height}`,
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });

let ws;
try {
  let targets;
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {}
    await delay(250);
  }
  const pageTarget = targets?.find((target) => target.type === 'page');
  if (!pageTarget) throw new Error('Chrome DevTools did not expose a page target');

  ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  const failedRequests = [];
  const pausedRequests = [];
  const networkUrls = new Map();
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { pending.get(message.id)?.resolve(message); pending.delete(message.id); }
    if (message.method === 'Network.requestWillBeSent') networkUrls.set(message.params.requestId, message.params.request.url);
    if (message.method === 'Fetch.requestPaused') {
      pausedRequests.push(message.params.request.url);
      send('Fetch.fulfillRequest', {
        requestId: message.params.requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/javascript; charset=utf-8' }], body: localG3ABank,
      });
    }
    if (message.method === 'Network.loadingFailed') failedRequests.push({ url: networkUrls.get(message.params.requestId), error: message.params.errorText });
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || 'page exception');
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value || arg.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*G3A.js*', requestStage: 'Request' }] });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Page.navigate', { url });
  let started = false, setupText = '';
  for (let attempt = 0; attempt < 50 && !started; attempt++) {
    const result = await send('Runtime.evaluate', {
      expression: `(() => { const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === '開始遊戲'); if (!button) return { started: false, text: document.body.innerText.slice(0, 160), scripts: [...document.scripts].map(s => s.src), ready: document.readyState, rg: !!window.RG, bank: !!window.REVIEW_BANK, app: document.querySelector('#app')?.innerHTML.slice(0, 180), data: performance.getEntriesByType('resource').filter(r => r.name.includes('data/G3A')).map(r => ({ name: r.name, duration: r.duration, size: r.transferSize })) }; if (window.RG3DMonopoly && !window.__qaMonopolyWrapped) { const mount = window.RG3DMonopoly.mount; window.RG3DMonopoly.mount = (options) => { const view = mount(options); window.__qaMonopolyView = view; return view; }; window.__qaMonopolyWrapped = true; } button.click(); return { started: true, text: '', scripts: [] }; })()`,
      returnByValue: true,
    });
    started = result.result?.result?.value?.started || false;
    setupText = JSON.stringify(result.result?.result?.value || {});
    if (!started) await delay(250);
  }
  if (!started) throw new Error(`Could not start Monopoly from the setup screen: ${setupText}; errors=${JSON.stringify(errors)}; paused=${JSON.stringify(pausedRequests)}; failed=${JSON.stringify(failedRequests)}`);
  await delay(7000);
  let ownerFixture = null;
  if (ownerFixtureArg === 'true') {
    const fixture = await send('Runtime.evaluate', {
      expression: `(() => { const view = window.__qaMonopolyView; if (!view || !view.active) return { applied: false }; view.setOwner(7, 0); view.draw(); return { applied: true, owner: view.owners.get(7), ownerCount: view.owners.size }; })()`,
      returnByValue: true,
    });
    ownerFixture = fixture.result?.result?.value;
    if (!ownerFixture?.applied) throw new Error('Owner screenshot fixture could not reach the active Monopoly view');
    await delay(650);
  }
  const state = await send('Runtime.evaluate', {
    expression: `({ canvas: !!document.querySelector('canvas'), mode: document.querySelector('.rg3d-status')?.textContent || '', active3d: !!document.querySelector('.rg3d-monopoly.is-3d'), viewport: [innerWidth, innerHeight], overflowX: document.documentElement.scrollWidth > innerWidth })`,
    returnByValue: true,
  });
  const screenshotOptions = { format: 'png' };
  if (fullPageArg === 'true') {
    const metrics = await send('Page.getLayoutMetrics');
    const size = metrics.result.cssContentSize;
    screenshotOptions.captureBeyondViewport = true;
    screenshotOptions.clip = { x: 0, y: 0, width: Math.max(width, size.width), height: size.height, scale: 1 };
  }
  const screenshot = await send('Page.captureScreenshot', screenshotOptions);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, Buffer.from(screenshot.result.data, 'base64'));
  console.log(JSON.stringify({ output, state: state.result.result.value, ownerFixture, errors, pausedRequests, failedRequests }));
} finally {
  ws?.close();
  if (process.platform === 'win32' && chrome.pid) spawnSync('taskkill.exe', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
  else chrome.kill();
}
