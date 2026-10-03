#!/usr/bin/env python3
"""從 Make Me a Hanzi 抽出本站用得到的字：筆畫路徑＋部件拆解，並算出形似字「不同的部件」。

資料來源（不進 repo，放 ~/mandarin-work/_vendor/makemeahanzi/）：
  dictionary.txt（LGPL-3.0）、graphics.txt（Arphic Public License）
輸出：public/data/_index/hanzi/<冊別>.json（只含該冊形似字與生字，按需載入）

    python3 tools/build_hanzi_parts.py
"""
import glob
import json
import os

VENDOR = os.path.expanduser('~/mandarin-work/_vendor/makemeahanzi')
OUT = 'public/data/_index/hanzi'
# CF 核對後標「有誤」的形似字組 id，放這裡就不標色（例：'lookalike:115AG3H06:1'）
EXCLUDE = set()
ARITY = {'⿰': 2, '⿱': 2, '⿲': 3, '⿳': 3, '⿴': 2, '⿵': 2, '⿶': 2, '⿷': 2, '⿸': 2, '⿹': 2, '⿺': 2, '⿻': 2}


def parse(ids):
    """回傳 (運算子, [子部件字串])；無法拆時 (None, [])。"""
    if not ids or ids[0] not in ARITY:
        return None, []

    def take(i):
        c = ids[i]
        if c in ARITY:
            j = i + 1
            for _ in range(ARITY[c]):
                j = take(j)
            return j
        return i + 1

    kids, i = [], 1
    for _ in range(ARITY[ids[0]]):
        j = take(i)
        kids.append(ids[i:j])
        i = j
    return ids[0], kids


def diff_strokes(char, group, D):
    """char 在 group 裡和其他字不同的部件，對應的筆畫索引。"""
    me = D.get(char)
    if not me or '？' in me.get('decomposition', '？'):
        return None
    op, kids = parse(me['decomposition'])
    if not kids:
        return None
    others = [parse(D[o]['decomposition']) for o in group if o != char and o in D]
    if not others:
        return None
    differ = set()
    for k, comp in enumerate(kids):
        same_slot = any(o_op == op and k < len(o_kids) and o_kids[k] == comp for o_op, o_kids in others)
        # 結構不同（逗 ⿺辶豆、短 ⿰矢豆）時，部件出現在對方任何位置也算相同
        anywhere = any(comp in o_kids for _, o_kids in others) or comp in group  # 墨＝黑＋土：「黑」就是同組的字
        if not (same_slot or anywhere):
            differ.add(k)
    strokes = [i for i, m in enumerate(me.get('matches') or []) if m and m[0] in differ]
    total = len(me.get('matches') or [])
    # 全部都不同或完全相同，就沒有「局部差異」可標
    if not strokes or len(strokes) == total:
        return None
    return strokes


def main():
    D = {}
    for line in open(f'{VENDOR}/dictionary.txt'):
        x = json.loads(line)
        D[x['character']] = x
    G = {}
    for line in open(f'{VENDOR}/graphics.txt'):
        x = json.loads(line)
        G[x['character']] = x['strokes']
    os.makedirs(OUT, exist_ok=True)
    for vol_dir in sorted(glob.glob('public/data/115AG*')):
        vol = os.path.basename(vol_dir)
        need, diffs = set(), {}
        for path in sorted(glob.glob(f'{vol_dir}/lesson*.json')):
            lesson = json.load(open(path))
            for g in lesson.get('lookalikes', []):
                chars = [c['char'] for c in g.get('chars', []) if c.get('char')]
                need.update(chars)
                if g['id'] in EXCLUDE:
                    continue
                for c in chars:
                    s = diff_strokes(c, chars, D)
                    if s:
                        diffs.setdefault(g['id'], {})[c] = s
            for c in lesson.get('characters', []):
                ch = c.get('char') or c.get('character')
                if ch:
                    need.add(ch)
        chars = {c: {'s': G[c], 'd': D[c].get('decomposition', '')} for c in sorted(need) if c in G and c in D}
        out = {'source': 'Make Me a Hanzi（dictionary: LGPL-3.0；graphics: Arphic Public License）',
               'chars': chars, 'lookalike_diff': diffs}
        with open(f'{OUT}/{vol}.json', 'w') as f:
            json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        print(vol, len(chars), '字；有部件差異的形似字組', len(diffs), f'{os.path.getsize(f"{OUT}/{vol}.json") // 1024}KB')


if __name__ == '__main__':
    main()
