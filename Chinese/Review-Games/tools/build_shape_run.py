#!/usr/bin/env python3
"""形似字跑酷（Chinese/Shape-Run-G*）題庫產生器與檢查。

正本：課次資料 apps/mandarin/public/data/<冊>/lessonNN.json 的 words 與 lookalikes。
做法：把多字語詞中屬於官方形似字組的字，換成同組其他字，當作錯字選項；
換字後仍是《國語辭典簡編本》詞條者剔除（需本機離線詞庫），另有人工剔除清單 EXCLUDE。

程式只有一份：Shape-Run-G6A/index.html 是母版，其餘年級複製母版、只換 DATA 與標題。
所以改遊戲時只改 G6A，再跑本工具同步。

用法（repo 根目錄）：
  python3 Chinese/Review-Games/tools/build_shape_run.py          # 重產五個年級
  python3 Chinese/Review-Games/tools/build_shape_run.py --check  # 只檢查，不寫檔
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / 'apps/mandarin/public/data'
GAMES = ROOT / 'Chinese'
MASTER = 'G6A'
LEXICON = Path.home() / 'mandarin-work/moe-dict/concised_lexicon_2014_20260929.json'
OK = {'ready', 'approved'}

# 代號: (冊別, 年級名, 版本, 課次)
GRADES = {
    'G1A': ('115AG1H', '一上', '翰林', range(1, 8)),
    'G2A': ('115AG2H', '二上', '翰林', range(1, 7)),
    'G3A': ('115AG3H', '三上', '翰林', range(1, 7)),
    'G4A': ('115AG4K', '四上', '康軒', range(1, 7)),
    'G6A': ('115AG6H', '六上', '翰林', range(1, 7)),
}

# 人工剔除：詞庫沒收、但其實是正確寫法／常見異體／真詞的換字結果（2026-10-15、16 逐筆判斷）
EXCLUDE_WRONG = {
    '精練',                                  # 精鍊的通用寫法
    '部份', '筆心', '註意', '制成', '凸槽',  # 異體或真詞
    '花草', '大車', '一站',                  # 真詞
}
# 人名不出題（換字練習意義不大）
EXCLUDE_WORD = {'江秀真', '海倫‧凱勒'}

DATA_RE = re.compile(r'const DATA = (\[.*?\]);\n', re.S)


def build(code, lexicon):
    vol, _, _, lessons = GRADES[code]
    out = []
    for n in lessons:
        d = json.loads((DATA / vol / f'lesson{n:02d}.json').read_text(encoding='utf-8'))
        groups = [[c['char'] for c in g['chars']] for g in (d.get('lookalikes') or []) if g.get('status') in OK]
        for w in [w['word'] for w in d['words'] if w.get('status') in OK]:
            if len(w) < 2 or w in EXCLUDE_WORD:   # 單字詞換字後仍是正確的字，不出題
                continue
            xs = []
            for i, ch in enumerate(w):
                for g in groups:
                    if ch not in g:
                        continue
                    for o in g:
                        x = w[:i] + o + w[i + 1:]
                        if o != ch and x not in lexicon and x not in EXCLUDE_WRONG and x not in xs:
                            xs.append(x)
            if xs:
                out.append({'L': n, 'w': w, 'x': xs})
    return out


def render(master, code, data):
    _, gr, pub, lessons = GRADES[code]
    rng = f'1～{lessons[-1]}'
    h = master.replace('六上形似字跑酷', f'{gr}形似字跑酷').replace('翰林六上', f'{pub}{gr}')
    h = h.replace(f'{pub}{gr}第 1～6 課', f'{pub}{gr}第 {rng} 課').replace(f'{pub}{gr}第1～6課', f'{pub}{gr}第{rng}課')
    return DATA_RE.sub(lambda m: f'const DATA = {json.dumps(data, ensure_ascii=False)};\n', h, count=1)


def check(code, data):
    errs = []
    if not data:
        errs.append('沒有任何題目')
    for e in data:
        if not e['x']:
            errs.append(f"{e['w']} 沒有錯字選項")
        if e['w'] in e['x']:
            errs.append(f"{e['w']} 錯字選項含正解")
        for x in e['x']:
            if len(x) != len(e['w']) or sum(a != b for a, b in zip(x, e['w'])) != 1:
                errs.append(f"{e['w']}→{x} 不是只差一個字")
    lessons = {e['L'] for e in data}
    missing = [n for n in GRADES[code][3] if n not in lessons]
    if missing:
        errs.append(f'第 {missing} 課沒有題目（該課沒有可用的形似字組時屬正常，請人工確認）')
    return errs


def main():
    only_check = '--check' in sys.argv
    if not LEXICON.exists():
        sys.exit(f'找不到簡編本詞庫 {LEXICON}：無法剔除「換字仍成詞」的選項，請在有 mandarin-work 的電腦執行。')
    lexicon = set(json.loads(LEXICON.read_text(encoding='utf-8'))['words'])
    master = (GAMES / f'Shape-Run-{MASTER}' / 'index.html').read_text(encoding='utf-8')
    bad = False
    for code in GRADES:
        data = build(code, lexicon)
        path = GAMES / f'Shape-Run-{code}' / 'index.html'
        want = render(master, code, data)
        errs = check(code, data)
        if only_check:
            cur = path.read_text(encoding='utf-8') if path.exists() else ''
            if cur != want:
                errs.append('檔案和母版＋課次資料不一致，請重跑本工具')
        else:
            path.parent.mkdir(exist_ok=True)
            path.write_text(want, encoding='utf-8')
        hard = sum(1 for e in data if len(e['x']) >= 2)
        flag = '⚠️' if errs else '✅'
        print(f'{flag} {code}：{len(data)} 個語詞、{sum(len(e["x"]) for e in data)} 個錯字（高級可用 {hard} 詞）')
        for e in errs:
            print('   -', e)
        bad |= any('不一致' in e or '含正解' in e or '只差' in e or '沒有任何' in e for e in errs)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
