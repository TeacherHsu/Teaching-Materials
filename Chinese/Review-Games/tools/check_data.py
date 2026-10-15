#!/usr/bin/env python3
"""檢查綜合複習遊戲題庫（data/*.js）是否正確。重產題庫後必跑；有錯誤時結束碼為 1。

檢查項目：課次數、隨機出題的干擾項候選數、每題答案在選項內、選項不重複、選項數、題幹非空、
注音題答案與語詞資料一致、形似字題只有一個空格、語詞／成語不重複、題目只屬於有效課次。

用法：python3 Chinese/Review-Games/tools/check_data.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
EXPECT = {'G1A': 7, 'G2A': 6, 'G3A': 6, 'G4A': 6, 'G6A': 6}
TYPES = {'meaning', 'zhuyin', 'lookalike', 'idiom', 'reading', 'gist'}
MIN_OPTIONS = {'lookalike': 2}


def load(key):
    text = (HERE / 'data' / f'{key}.js').read_text(encoding='utf-8')
    return json.loads(text[text.index('{'):text.rindex('}') + 1])


def check(key, bank):
    errors, warns = [], []
    nos = [l['no'] for l in bank['lessons']]
    if nos != list(range(1, EXPECT[key] + 1)):
        errors.append(f'課次應為 1～{EXPECT[key]}，實際 {nos}')
    words = {w['word']: w for w in bank['words']}
    if len(words) != len(bank['words']):
        warns.append('語詞有重複（跨課同詞，遊戲會自動去重）')
    for i, q in enumerate(bank['questions']):
        tag = f'#{i} 第{q["lesson"]}課 {q["type"]}「{q["stem"][:20]}」'
        if q['type'] not in TYPES:
            errors.append(f'{tag} 題型不明')
        if q['lesson'] not in nos:
            errors.append(f'{tag} 課次不存在')
        if not q['stem'].strip():
            errors.append(f'{tag} 題幹空白')
        opts = q['options']
        if q['answer'] not in opts:
            errors.append(f'{tag} 答案不在選項內')
        if len(set(opts)) != len(opts):
            errors.append(f'{tag} 選項重複 {opts}')
        if len(opts) < MIN_OPTIONS.get(q['type'], 4):
            errors.append(f'{tag} 選項只有 {len(opts)} 個')
        if any(not str(o).strip() for o in opts):
            errors.append(f'{tag} 有空白選項')
        if q['type'] == 'zhuyin':
            word = q['stem'].split('「')[1].split('」')[0]
            if word in words and words[word]['zhuyin'] != q['answer']:
                errors.append(f'{tag} 注音答案與語詞資料不一致')
        if q['type'] == 'lookalike' and q['stem'].count('＿') != 1:
            errors.append(f'{tag} 空格數不是 1')
    counts = {t: sum(1 for q in bank['questions'] if q['type'] == t) for t in TYPES}
    # 隨機出題：語詞意思／注音／成語題要有足夠干擾項候選（≥5 個選項），遊戲每次才能抽出不同組合
    for t in ('meaning', 'zhuyin', 'idiom'):
        qs = [q for q in bank['questions'] if q['type'] == t]
        rich = sum(1 for q in qs if len(q['options']) >= 5)
        if qs and rich / len(qs) < 0.9:
            errors.append(f'{t} 題只有 {rich}/{len(qs)} 題有 ≥5 個選項候選，無法每次隨機換選項')
    for n in nos:
        if not any(q['lesson'] == n for q in bank['questions']):
            errors.append(f'第{n}課沒有任何題目')
    return errors, warns, counts


def main():
    bad = False
    for key in EXPECT:
        bank = load(key)
        errors, warns, counts = check(key, bank)
        status = '❌' if errors else '✅'
        print(f'{status} {key}（{bank["grade"]}）{len(bank["lessons"])} 課、{len(bank["questions"])} 題 {counts}')
        for e in errors[:20]:
            print('   錯誤：', e)
        for w in warns:
            print('   提醒：', w)
        bad |= bool(errors)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
