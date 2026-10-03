#!/usr/bin/env python3
"""修正四上形似字資料的「字」欄位（2026-10-04 發現）。

康軒四上匯入時，形似字的 char 誤取成「第一個例詞的第一個字」：
  應為「秀／誘」，例詞「引誘、誘人」卻存成 char=引。
正確的字是兩個例詞共有的那個字。為了不誤改，只在下列條件都成立時才換：
  1. char 是第一個例詞的第一個字，且不出現在第二個例詞
  2. 例詞共有的字剛好一個
  3. 換上去的字和同組其他字共用部件（用 Make Me a Hanzi 拆字確認），
     或同組其他字本身也是這次要換的（整組一起錯）
    python3 tools/fix_lookalike_chars.py          # 只列出
    python3 tools/fix_lookalike_chars.py --write  # 寫入
"""
import glob, json, os, re, sys
VENDOR = os.path.expanduser('~/mandarin-work/_vendor/makemeahanzi/dictionary.txt')
D = {}
for line in open(VENDOR):
    x = json.loads(line); D[x['character']] = x

def comps(ch):
    d = D.get(ch, {}).get('decomposition', '')
    return {c for c in d if '㐀' <= c <= '鿿'} | {ch}

write = '--write' in sys.argv
MANUAL_OK = {'115AG4K01鷹', '115AG4K04奏', '115AG4K07用', '115AG4K09奏', '115AG4K11示', '115AG4K12賣'}
changed = 0
for p in sorted(glob.glob('public/data/115AG4K/lesson*.json')):
    lesson = json.load(open(p)); dirty = False
    for g in lesson.get('lookalikes', []):
        proposals = {}
        for idx, c in enumerate(g['chars']):
            words = [w for w in re.split('[、,，]', c.get('example') or '') if w]
            if len(words) < 2: continue
            common = set(words[0]).intersection(*map(set, words[1:]))
            if words[0][0] == c['char'] and c['char'] not in words[1] and len(common) == 1:
                proposals[idx] = common.pop()
        if not proposals: continue
        final = [proposals.get(i, c['char']) for i, c in enumerate(g['chars'])]
        for idx, c in enumerate(g['chars']):
            new = proposals.get(idx)
            if not new: continue
            others = [x for j, x in enumerate(final) if j != idx]
            # 形近但不共用部件（鷹／應、奉／奏、甩／用、示／末／未、賣／買）經 CF 交辦、人工逐組確認
            if any(comps(new) & comps(o) for o in others) or lesson['lesson_id'] + new in MANUAL_OK:
                print(lesson['lesson_id'], c['char'], '→', new, '｜同組：', '、'.join(final))
                if write:
                    c['char_original'] = c['char']; c['char'] = new; dirty = True
                changed += 1
            else:
                print(lesson['lesson_id'], c['char'], '→', new, '（和同組不共用部件，不改，請人工看）', '、'.join(final))
    if dirty:
        json.dump(lesson, open(p, 'w'), ensure_ascii=False, indent=2); open(p, 'a').write('\n')
print('可修正', changed)
