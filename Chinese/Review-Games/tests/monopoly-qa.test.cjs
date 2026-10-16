/* QA 注入腳本的契約；不啟動瀏覽器，不引用遊戲內部狀態。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
test('qaOwnAll 僅以 view.setOwner 指派十二地，遊戲卡片保持起始值', async () => {
  const calls = [], view = { ready: Promise.resolve(), active: true, owners: new Map(), tokens: new Map([[0,0],[1,0],[2,0],[3,0]]),
    cells: Array.from({length:20}, (_,id)=>({ id, band: [1,2,4,5,7,8,11,12,14,15,17,18].includes(id) ? '#abc' : null })),
    async setOwner(id,team) { calls.push([id,team]); this.owners.set(id,team); }, stats:()=>({}) };
  const api={ mount:()=>view }, originalMount=api.mount;
  const teamCards=Array.from({length:4},(_,i)=>({textContent:`第${i+1}隊 1000 元 地產 0 塊 學習章 0`}));
  let starts=0;
  const button={textContent:'開始遊戲',click(){starts++; api.mount({});}};
  const document={ querySelector:()=>null, documentElement:{scrollWidth:1024}, querySelectorAll(selector) {
    return selector==='button' ? [button] : selector==='.side .team' ? teamCards : [];
  }};
  const math=Object.create(Math), originalRandom=math.random;
  const c={window:{RG3DMonopoly:api},document,Math:math,URLSearchParams,location:{search:'?qaOwnAll=1'},innerWidth:1024,innerHeight:768,performance:{now:()=>0},setTimeout};
  const source=fs.readFileSync(path.join(__dirname,'../tools/qa/shot-monopoly.js'),'utf8');
  const state=await vm.runInNewContext(`(async()=>{${source}})()`,c);
  assert.equal(starts,1); assert.equal(state.fixture,'T1B-all-buildings-view-only');
  assert.deepEqual(calls,view.cells.filter(c=>c.band).map((c,i)=>[c.id,i%4]));
  assert.equal(state.results,undefined); assert.equal(view.tokens.size,4);
  assert.ok(state.teams.every(t=>t.includes('1000 元 地產 0 塊')));
  assert.equal(api.mount,originalMount); assert.equal(math.random,originalRandom);
});
