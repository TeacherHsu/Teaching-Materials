#!/usr/bin/env node
/**
 * 設定「課文點讀小幫手」的存取密碼（2026-09-30）
 *
 * 用法：node set-password.mjs
 * 它只把密碼的 SHA-256 雜湊寫進 access-config.js；密碼本身不會被存檔，
 * 也不會出現在終端機紀錄裡（輸入時不回顯）。
 *
 * 換密碼就再跑一次；所有裝置上已解鎖的紀錄會自動失效，需要重新輸入。
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import readline from 'node:readline';

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(here, 'access-config.js');

function askHidden(question) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        const onData = char => {
            // 輸入過程不回顯，避免密碼留在畫面或終端機捲動紀錄上。
            if (['\n', '\r', '\u0004'].includes(String(char))) process.stdin.removeListener('data', onData);
            else readline.moveCursor(process.stdout, -1000, 0), readline.clearLine(process.stdout, 1), process.stdout.write(question);
        };
        process.stdout.write(question);
        process.stdin.on('data', onData);
        rl.question('', answer => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    });
}

const password = (await askHidden('請輸入新密碼：')).trim();
if (password.length < 4) {
    console.error('密碼太短（至少 4 個字），沒有變更。');
    process.exit(1);
}
const again = (await askHidden('請再輸入一次：')).trim();
if (password !== again) {
    console.error('兩次輸入不一致，沒有變更。');
    process.exit(1);
}

const hash = createHash('sha256').update(password, 'utf8').digest('hex');
const source = readFileSync(configPath, 'utf8');
const updated = source.replace(/passwordHash:\s*'[^']*'/, `passwordHash: '${hash}'`);
if (updated === source) {
    console.error('access-config.js 格式不符預期，沒有變更。');
    process.exit(1);
}
writeFileSync(configPath, updated);
console.log('已更新 access-config.js。請 commit 後重新部署，密碼門就會生效。');
console.log('提醒：所有裝置上先前的解鎖紀錄都會失效，需要重新輸入密碼。');
