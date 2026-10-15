#!/usr/bin/env python3
"""從課文樂園課次資料產生「課文偵探密室」關卡資料（data/detective-G3A.js 等）。

教材事實（線索、題目、答案）只取 status 為 ready／approved 的既有欄位，不改寫、不含課文全文；
偵探故事包裝（委託信、物件名稱）是遊戲原創文字，畫面上標示為「偵探任務」，與教材分開。

每課一間密室，謎題依教材有無自動組合：
  search 線索搜尋   ← paragraph_summary（段落大意，教師核准版）
  sort   事件排序   ← paragraph_summary 的 paragraph_no
  dial   國字密碼鎖 ← lookalikes（形似字；簡編本詞庫剔除換字仍成詞的選項）
  keys   鑰匙開鎖   ← words（語詞＋意思）
  blocks 詞塊組句   ← sentence_patterns（句型結構＋已核准例句；依結構槽位判斷，不只比對唯一字串）
  compare 證詞比對  ← reading_questions（提取訊息）
  cause  因果推理   ← reading_questions（推論／詮釋／比較）
  final  最終推理   ← main_idea（主旨）＋已核准的干擾敘述
資料不足的課在 gaps 列出，不產生空殼關卡。

用法：python3 Chinese/Review-Games/tools/build_detective.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / 'apps/mandarin/public/data'
OUT = Path(__file__).resolve().parents[1] / 'data'
LEXICON = Path.home() / 'mandarin-work/moe-dict/concised_lexicon_2014_20260929.json'
GRADES = {
    'G1A': ('115AG1H', '一上', '翰林'),
    'G2A': ('115AG2H', '二上', '翰林'),
    'G3A': ('115AG3H', '三上', '翰林'),
    'G4A': ('115AG4K', '四上', '康軒'),
    'G6A': ('115AG6H', '六上', '翰林'),
}
OK = {'ready', 'approved'}
THEMES = ['study', 'classroom', 'library', 'forest', 'lab', 'museum']
PUNCT = '。，、！？；：「」『』﹁﹂…—'

lexicon = {}
if LEXICON.exists():
    lexicon = json.loads(LEXICON.read_text(encoding='utf-8'))['words']


def ok(x):
    return isinstance(x, dict) and x.get('status') in OK


def strip_p(s):
    return s.strip().strip(PUNCT).strip()


def clues_of(d):
    out = []
    for p in d.get('paragraph_summary', []):
        if not ok(p) or not p.get('summary'):
            continue
        paras = sorted({s['para'] for s in p.get('text_spots', []) if 'para' in s})
        no = p.get('paragraph_no', p.get('para_no'))
        if no is None:
            continue
        out.append({'id': f"c{no}", 'order': no, 'text': p['summary'],
                    'block': p.get('structure_block') or '', 'paras': paras, 'ref': p.get('id', '')})
    out.sort(key=lambda c: c['order'])
    # 段落編號必須互不相同，排序才有唯一答案
    if len({c['order'] for c in out}) != len(out):
        return []
    return out


def linked(q, clues):
    paras = {e.get('para') for e in q.get('evidence', []) or []}
    return [c['id'] for c in clues if paras & set(c['paras'])]


def rq_item(q, clues, kind):
    hints = [h.get('text') for h in q.get('hints', []) if h.get('text')]
    return {'type': kind, 'id': q['id'], 'stem': q['stem'], 'answer': q['answer'],
            'options': [o for o in q['options'] if o != q['answer']], 'tag': q.get('strategy_tag', ''),
            'evidence': linked(q, clues), 'hints': hints, 'ref': q['id']}


def dials_of(d):
    out = []
    for g in d.get('lookalikes', []):
        if not ok(g) or g.get('not_shape_similar'):
            continue
        chars = list(dict.fromkeys(c['char'] for c in g['chars']))
        if len(chars) < 2:
            continue
        for c in g['chars']:
            for ex in (c.get('example') or '').split('、'):
                ex = ex.strip()
                if len(ex) < 2 or ex.count(c['char']) != 1:
                    continue
                # 其他字換進去若仍是真詞，就不能當干擾項（避免多解）
                wrong = [x for x in chars if x != c['char'] and (not lexicon or ex.replace(c['char'], x) not in lexicon)]
                if len(wrong) < 1:
                    continue
                out.append({'word': ex, 'answer': c['char'], 'wrong': wrong[:4],
                            'blank': ex.replace(c['char'], '＿'), 'ref': g['id']})
                break
    # 同一個答案字只留一題
    seen, res = set(), []
    for x in out:
        if x['answer'] in seen:
            continue
        seen.add(x['answer'])
        res.append(x)
    return res


def keys_of(d):
    res, meanings = [], set()
    for w in d.get('words', []):
        m = (w.get('meaning') or '').strip()
        if not ok(w) or not m or w['word'] in m or m in meanings:
            continue
        meanings.add(m)
        res.append({'word': w['word'], 'meaning': m, 'ref': w.get('id', '')})
    return res


LABEL = re.compile(r'^(名詞|動詞|形容詞|副詞|量詞|數詞|代詞|人物|人|地點|時間|事物|疊字\S*|\S{0,4}詞)$')


def frame_of(structure):
    """把「（人物）＋想辦法，解決了＋（問題）。」拆成 ['S', '想辦法，解決了', 'S']。
    「名詞（誰）」「量詞」這類詞性標籤也算槽位。"""
    parts = []

    def slot():
        if not parts or parts[-1] != 'S':
            parts.append('S')
    for tok in structure.split('＋'):
        tok = tok.strip()
        bare = strip_p(re.sub(r'（[^）]*）', '', tok))
        if '（' in tok and (not bare or LABEL.match(bare)):
            slot()
            continue
        if LABEL.match(strip_p(tok)):
            slot()
            continue
        for piece in re.split(r'(（[^）]*）)', tok):
            piece = piece.strip()
            if not piece:
                continue
            if piece.startswith('（'):
                slot()
            else:
                f = strip_p(piece)
                if f:
                    parts.append(f)
    return parts


def split_example(frame, ex):
    """依結構把例句切成槽位片段；切不出來回傳 None。"""
    s = strip_p(ex)
    segs, pos = [], 0
    for i, part in enumerate(frame):
        if part == 'S':
            continue
        j = s.find(part, pos)
        if j < 0:
            return None
        if i > 0 and frame[i - 1] == 'S':
            filler = strip_p(s[pos:j])
            if not filler:
                return None
            segs.append(filler)
        elif j != pos:
            return None
        segs.append(part)
        pos = j + len(part)
    if frame[-1] == 'S':
        filler = strip_p(s[pos:])
        if not filler:
            return None
        segs.append(filler)
    elif strip_p(s[pos:]):
        return None
    return segs if len(segs) == len(frame) else None


def blocks_of(d):
    res = []
    for p in d.get('sentence_patterns', []):
        if not ok(p) or p.get('examples_status') not in OK or not p.get('structure'):
            continue
        frame = frame_of(p['structure'])
        if 'S' not in frame or len(frame) < 3:
            continue
        rows = [r for r in (split_example(frame, ex) for ex in p.get('examples', [])) if r]
        if not rows:
            continue
        fillers = [sorted({r[i] for r in rows}) if part == 'S' else [] for i, part in enumerate(frame)]
        res.append({'id': p['id'], 'structure': p['structure'], 'frame': frame, 'rows': rows,
                    'fillers': fillers, 'ref': p['id']})
    # 短語積木（教師確認的 accepted 清單本身就是多解）：補進來當詞塊題
    for pb in d.get('phrase_builders', []) or []:
        if not ok(pb) or not pb.get('accepted'):
            continue
        # 純標點的積木不當詞塊（標點由畫面補上）
        acc = [[c for c in a if strip_p(c)] for a in pb['accepted']]
        acc = [a for a in acc if len(a) >= 3]
        if not acc:
            continue
        res.append({'id': pb['id'], 'structure': (pb.get('official') or {}).get('structure', ''),
                    'rows': [acc[0]], 'accepted': acc, 'ref': pb['id']})
    return res


def room_of(code, n, d):
    clues = clues_of(d)
    rqs = [q for q in d.get('reading_questions', []) if ok(q) and q.get('answer') in q.get('options', [])]
    extract = [q for q in rqs if q.get('strategy_tag') == '提取訊息']
    infer = [q for q in rqs if q.get('strategy_tag') != '提取訊息']
    infer.sort(key=lambda q: 0 if re.search('為什麼|為何|怎麼會|因為', q['stem']) else 1)
    mi = d.get('main_idea') or {}
    gaps = []
    puzzles = {}
    if len(clues) >= 3:
        puzzles['search'] = {'type': 'search'}
        puzzles['sort'] = {'type': 'sort'}
    else:
        gaps.append('段落大意少於 3 段（無法做線索搜尋與事件排序）')
    dials = dials_of(d)
    if dials:
        puzzles['dial'] = {'type': 'dial', 'items': dials}
    else:
        gaps.append('沒有可單一解的形似字題（國字密碼鎖略過）')
    keys = keys_of(d)
    if len(keys) >= 4:
        puzzles['keys'] = {'type': 'keys', 'items': keys}
    else:
        gaps.append('有意思的語詞少於 4 個（鑰匙開鎖略過）')
    blocks = blocks_of(d)
    if blocks:
        puzzles['blocks'] = {'type': 'blocks', 'items': blocks}
    else:
        gaps.append('句型例句無法依結構切成詞塊（詞塊組句略過）')
    if extract or len(infer) > 1:
        q = extract[0] if extract else infer.pop()
        puzzles['compare'] = rq_item(q, clues, 'compare')
    else:
        gaps.append('沒有提取訊息閱讀題（證詞比對略過）')
    if infer:
        puzzles['cause'] = rq_item(infer[0], clues, 'cause')
    else:
        gaps.append('沒有推論閱讀題（因果推理略過）')
    decoys = [x['text'] for x in mi.get('distractors', []) if x.get('status') == 'approved']
    if ok(mi) and mi.get('gist') and len(decoys) >= 2:
        puzzles['final'] = {'type': 'final', 'answer': mi['gist'], 'options': decoys, 'ref': mi.get('id', '')}
    else:
        gaps.append('主旨或已核准的干擾敘述不足（最終推理略過）')
    core = {'search', 'sort', 'final'}
    mech = [k for k in ('dial', 'keys', 'blocks', 'compare', 'cause') if k in puzzles]
    playable = core <= set(puzzles) and len(mech) >= 2
    if not playable:
        gaps.append('未達可玩門檻（需線索搜尋、事件排序、最終推理＋至少兩種機關）')
    refs = sorted({v.get('ref') for v in puzzles.values() if v.get('ref')} | {c['ref'] for c in clues}
                  | {i['ref'] for p in puzzles.values() for i in p.get('items', []) if i.get('ref')})
    return {
        'lessonId': d['lesson_id'], 'no': n, 'title': d['title'],
        'roomId': f"{d['lesson_id']}-room", 'sceneTheme': THEMES[(n - 1) % len(THEMES)],
        'sourceRefs': refs, 'clues': clues, 'puzzles': puzzles if playable else {},
        'playable': playable, 'gaps': gaps,
    }


def main():
    OUT.mkdir(exist_ok=True)
    for key, (code, label, pub) in GRADES.items():
        files = sorted((DATA / code).glob('lesson*.json'))
        rooms = []
        for f in files:
            d = json.loads(f.read_text(encoding='utf-8'))
            rooms.append(room_of(code, d['lesson_no'], d))
        bank = {'grade': label, 'publisher': pub, 'code': code, 'rooms': rooms}
        body = json.dumps(bank, ensure_ascii=False, separators=(',', ':'))
        (OUT / f'detective-{key}.js').write_text(
            f'// 由 tools/build_detective.py 產生，請勿手改。來源：apps/mandarin/public/data/{code}/\n'
            f'window.DETECTIVE_BANK = {body};\n', encoding='utf-8')
        play = sum(r['playable'] for r in rooms)
        print(key, f'{play}/{len(rooms)} 課可玩', {r['no']: sorted(r['puzzles']) for r in rooms if r['playable']} if False else '')
        for r in rooms:
            if r['gaps']:
                print('  ', f"第{r['no']}課", '；'.join(r['gaps']))
    if not lexicon:
        print('⚠️ 找不到簡編本詞庫，國字密碼鎖未剔除「換字仍成詞」的選項')


if __name__ == '__main__':
    main()
