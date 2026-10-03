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
import unicodedata

VENDOR = os.path.expanduser('~/mandarin-work/_vendor/makemeahanzi')
OUT = 'public/data/_index/hanzi'
# CF 核對後標「有誤」的形似字組 id，放這裡就不標色（例：'lookalike:115AG3H06:1'）
EXCLUDE = set()
# CF 核對後筆順有誤的生字，放這裡就不給動畫（卡片仍有外部筆順連結）
STROKE_EXCLUDE = set()
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


# 部首的變形寫法：課本部首寫「水」，字裡長成「氵」
RADICAL_FORMS = {
    '水': '氵氺', '手': '扌', '心': '忄㣺', '人': '亻', '犬': '犭', '衣': '衤', '刀': '刂', '火': '灬',
    '艸': '艹', '辵': '辶⻌', '邑': '阝', '阜': '阝', '玉': '王', '肉': '月⺼', '金': '釒钅', '糸': '糹纟',
    '言': '訁讠', '食': '飠饣', '示': '礻', '竹': '⺮', '网': '罒', '老': '耂', '足': '⻊', '牛': '牜',
    '羊': '⺶', '爪': '爫', '攴': '攵', '歹': '歺', '冫': '冫', '彳': '彳', '目': '目', '頁': '页',
}


def component_at(ids, path):
    """沿著 matches 的路徑，回傳經過的每一層部件字串。"""
    chain, cur = [], ids
    for k in path:
        op, kids = parse(cur)
        if not kids or k >= len(kids):
            break
        cur = kids[k]
        chain.append(cur)
    return chain


def radical_strokes(char, radical, D):
    me = D.get(char)
    if not me or not radical or not me.get('matches'):
        return None
    radical = unicodedata.normalize('NFKC', radical)  # 康熙部首「⼤」→「大」
    forms = {radical, *RADICAL_FORMS.get(radical, '')}
    hits = [i for i, m in enumerate(me['matches'])
            if m and any(comp in forms for comp in component_at(me['decomposition'], m))]
    if not hits or len(hits) == len(me['matches']):
        return None  # 找不到，或整個字就是部首（例：「口」部的「口」），不標
    return hits


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


def stroke_center(strokes_median, idx):
    pts = [pt for i in idx for pt in strokes_median[i]]
    if not pts:
        return None
    # graphics 座標 y 軸朝上（900 在上）
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def mask_side(char, diff, G):
    """遮蔽字要遮「共同的那半」，讓不同的部件露出來；回傳要遮的方向。"""
    if not diff or char not in G:
        return None
    c = stroke_center(G[char]['medians'], diff)
    if not c:
        return None
    dx, dy = c[0] - 512, c[1] - 388
    if abs(dx) >= abs(dy):
        return 'right' if dx < 0 else 'left'   # 差異在左 → 遮右
    return 'bottom' if dy > 0 else 'top'       # 差異在上 → 遮下


def similar_chars(char, pool, D, limit=4):
    """同結構、共用至少一個部件的字（從全站字庫找），當字感訓練的形似字干擾項。"""
    op, kids = parse(D.get(char, {}).get('decomposition', ''))
    # 拆不乾淨（含「？」）或交疊結構（⿻）的字，部件不可靠，不找
    if not kids or op == '⿻' or any('？' in k for k in kids):
        return []
    scored = []
    for o in pool:
        if o == char or o not in D:
            continue
        o_op, o_kids = parse(D[o]['decomposition'])
        if o_op != op or len(o_kids) != len(kids) or any('？' in k for k in o_kids):
            continue
        same = [a for a, b in zip(kids, o_kids) if a == b]
        # 只共用部首（欄／村都是木部）看起來不像；要共用部首以外的部件（欄／攔共用「闌」）才算形似
        radical_forms = {D[char].get('radical', '')} | set(RADICAL_FORMS.get(D[char].get('radical', ''), ''))
        if same and len(same) < len(kids) and any(x not in radical_forms for x in same):
            scored.append((-len(same), o))
    return [o for _, o in sorted(scored)[:limit]]


def main():
    D = {}
    for line in open(f'{VENDOR}/dictionary.txt'):
        x = json.loads(line)
        D[x['character']] = x
    G = {}
    for line in open(f'{VENDOR}/graphics.txt'):
        x = json.loads(line)
        G[x['character']] = x
    os.makedirs(OUT, exist_ok=True)
    pool = set()
    for path in glob.glob('public/data/115AG*/lesson*.json'):
        lesson = json.load(open(path))
        for g in lesson.get('lookalikes', []):
            pool.update(c['char'] for c in g.get('chars', []) if c.get('char'))
        pool.update(c.get('char') for c in lesson.get('characters', []) if c.get('char'))
    for vol_dir in sorted(glob.glob('public/data/115AG*')):
        vol = os.path.basename(vol_dir)
        need, diffs, radicals, stroke_counts = set(), {}, {}, {}
        masks, similar = {}, {}
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
                        side = mask_side(c, s, G)
                        if side:
                            masks.setdefault(g['id'], {})[c] = side
                    extra = [o for o in similar_chars(c, pool, D) if o not in chars]
                    if extra:
                        similar[c] = extra  # 只當文字干擾項用，不需要筆畫資料
            for c in lesson.get('characters', []):
                ch = c.get('char') or c.get('character')
                if ch:
                    need.add(ch)
                    stroke_counts[ch] = c.get('stroke_count')
                    r = radical_strokes(ch, c.get('radical'), D)
                    if r:
                        radicals[ch] = r
        chars = {c: {'s': G[c]['strokes'], 'd': D[c].get('decomposition', '')} for c in sorted(need) if c in G and c in D}
        # 筆順動畫只給生字：筆畫中線（medians）；筆畫數和課本不同的字不給，免得教錯筆順
        mismatch = []
        for c, n in stroke_counts.items():
            if c in chars and n:
                if len(G[c]['medians']) == n and c not in STROKE_EXCLUDE:
                    chars[c]['m'] = [[[round(v) for v in pt] for pt in med] for med in G[c]['medians']]
                else:
                    mismatch.append(c)
        out = {'source': 'Make Me a Hanzi（dictionary: LGPL-3.0；graphics: Arphic Public License）',
               'chars': chars, 'lookalike_diff': diffs, 'radical_strokes': radicals,
               'mask_side': masks, 'similar': similar}
        with open(f'{OUT}/{vol}.json', 'w') as f:
            json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        anim = sum(1 for c in chars.values() if 'm' in c)
        print(f'  筆順動畫 {anim} 字；筆畫數對不上或排除 {len(mismatch)} 字：{"".join(sorted(mismatch))}')
        n_chars = sum(1 for p in glob.glob(f'{vol_dir}/lesson*.json') for c in json.load(open(p)).get('characters', []))
        print(vol, len(chars), '字；有部件差異的形似字組', len(diffs), f'；部首可標 {len(radicals)}/{n_chars}', f'{os.path.getsize(f"{OUT}/{vol}.json") // 1024}KB')


if __name__ == '__main__':
    main()
