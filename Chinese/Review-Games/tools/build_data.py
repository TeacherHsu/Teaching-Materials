#!/usr/bin/env python3
"""從課文樂園課次資料產生「綜合複習遊戲」題庫（data/G3A.js 等）。

只取 status 為 ready／approved 的項目；不含課文全文。
形似字題若有簡編本離線詞庫（~/mandarin-work/moe-dict/），會剔除「換字後仍是真詞」的選項。

用法：python3 Chinese/Review-Games/tools/build_data.py
"""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / 'apps/mandarin/public/data'
OUT = Path(__file__).resolve().parents[1] / 'data'
LEXICON = Path.home() / 'mandarin-work/moe-dict/concised_lexicon_2014_20260929.json'
GRADES = {
    'G1A': ('115AG1H', '一上', '翰林', range(1, 8)),
    'G2A': ('115AG2H', '二上', '翰林', range(1, 7)),
    'G3A': ('115AG3H', '三上', '翰林'),
    'G4A': ('115AG4K', '四上', '康軒'),
    'G6A': ('115AG6H', '六上', '翰林'),
}
LESSONS = range(1, 7)
OK = {'ready', 'approved'}
# 每題存 7 個干擾項候選；遊戲每次出題時再隨機抽 2～3 個，選項組合每次不同，避免學生記答案
POOL = 7

lexicon = {}
if LEXICON.exists():
    lexicon = json.loads(LEXICON.read_text(encoding='utf-8'))['words']


def ok(item):
    return item.get('status') in OK


def pick(pool, answer, n, key=lambda x: x, rng=None):
    """從 pool 取 n 個與 answer 不同、彼此不重複的干擾項。"""
    seen = {answer}
    out = []
    cands = list(pool)
    rng.shuffle(cands)
    for c in cands:
        v = key(c)
        if v in seen:
            continue
        seen.add(v)
        out.append(v)
        if len(out) == n:
            break
    return out


def build(code, label, publisher, lessons_range=range(1, 7)):
    rng = random.Random(code)
    lessons = []
    words, idioms, questions = [], [], []
    for n in lessons_range:
        d = json.loads((DATA / code / f'lesson{n:02d}.json').read_text(encoding='utf-8'))
        lessons.append({'no': n, 'title': d['title']})
        for w in d['words']:
            if ok(w) and w.get('meaning'):
                words.append({'lesson': n, 'word': w['word'], 'zhuyin': w.get('zhuyin') or '', 'meaning': w['meaning']})
        for i in d['idioms']:
            if ok(i) and i.get('definition'):
                idioms.append({'lesson': n, 'idiom': i['idiom'], 'definition': i['definition']})
        for q in d.get('reading_questions', []):
            if ok(q) and q.get('answer') in q.get('options', []):
                questions.append({'lesson': n, 'type': 'reading', 'stem': q['stem'],
                                  'options': q['options'], 'answer': q['answer']})
        for g in d.get('lookalikes', []):
            if not ok(g) or g.get('not_shape_similar'):
                continue
            chars = [c['char'] for c in g['chars']]
            if len(set(chars)) < 2:
                continue
            for c in g['chars']:
                ex = (c.get('example') or '').split('、')[0].strip()
                if c['char'] not in ex or len(ex) < 2:
                    continue
                opts = [x for x in chars if x == c['char']
                        or not lexicon or ex.replace(c['char'], x) not in lexicon]
                if len(opts) < 2:
                    continue
                blank = ex.replace(c['char'], '＿', 1)
                questions.append({'lesson': n, 'type': 'lookalike',
                                  'stem': f'哪個字可以填進「{blank}」？',
                                  'speak': f'哪個字可以填進，{ex}的空格？',
                                  'options': [c['char']] + [x for x in opts if x != c['char']][:3],
                                  'answer': c['char'], 'explain': ex})
        mi = d.get('main_idea') or {}
        if ok(mi) and mi.get('gist'):
            questions.append({'lesson': n, 'type': 'gist', 'stem': f'哪一課的大意是：「{mi["gist"]}」',
                              'options': None, 'answer': d['title']})

    titles = [l['title'] for l in lessons]
    for q in questions:
        if q['type'] == 'gist':
            q['options'] = [q['answer']] + pick(titles, q['answer'], len(titles) - 1, rng=rng)
    for w in words:
        same_len = [x for x in words if x['zhuyin'] and len(x['zhuyin'].split()) == len(w['zhuyin'].split())]
        zy = pick(same_len, w['zhuyin'], POOL, key=lambda x: x['zhuyin'], rng=rng) if w['zhuyin'] else []
        if len(zy) >= 3:
            questions.append({'lesson': w['lesson'], 'type': 'zhuyin', 'stem': f'「{w["word"]}」的注音是哪一個？',
                              'speak': f'{w["word"]}，怎麼念？', 'noSpeakOptions': True,
                              'options': [w['zhuyin']] + zy, 'answer': w['zhuyin']})
        # 干擾項：優先同字數；不夠再用其他語詞補；排除意思相同的詞，避免兩個都對
        others = [x for x in words if x['meaning'] != w['meaning']]
        same = [x for x in others if len(x['word']) == len(w['word'])]
        ws = pick(same, w['word'], POOL, key=lambda x: x['word'], rng=rng)
        if len(ws) < POOL:
            ws += pick([x for x in others if x['word'] not in ws], w['word'], POOL - len(ws), key=lambda x: x['word'], rng=rng)
        questions.append({'lesson': w['lesson'], 'type': 'meaning', 'stem': f'哪個語詞的意思是「{w["meaning"]}」？',
                          'options': [w['word']] + ws, 'answer': w['word']})
    for i in idioms:
        ids = pick([x for x in idioms if x['definition'] != i['definition']], i['idiom'], POOL, key=lambda x: x['idiom'], rng=rng)
        if len(ids) >= 3:
            questions.append({'lesson': i['lesson'], 'type': 'idiom', 'stem': f'哪個成語的意思是「{i["definition"]}」？',
                              'options': [i['idiom']] + ids, 'answer': i['idiom']})
    return {'grade': label, 'publisher': publisher, 'code': code, 'lessons': lessons,
            'words': words, 'idioms': idioms, 'questions': questions}


def main():
    OUT.mkdir(exist_ok=True)
    for key, (code, label, pub, *rng) in GRADES.items():
        bank = build(code, label, pub, *rng)
        body = json.dumps(bank, ensure_ascii=False, separators=(',', ':'))
        (OUT / f'{key}.js').write_text(
            f'// 由 tools/build_data.py 產生，請勿手改。來源：apps/mandarin/public/data/{code}/\n'
            f'window.REVIEW_BANK = {body};\n', encoding='utf-8')
        counts = {}
        for q in bank['questions']:
            counts[q['type']] = counts.get(q['type'], 0) + 1
        print(key, len(bank['words']), 'words', len(bank['idioms']), 'idioms', counts)
    if not lexicon:
        print('⚠️ 找不到簡編本詞庫，形似字題未剔除「換字仍成詞」的選項')


if __name__ == '__main__':
    main()
