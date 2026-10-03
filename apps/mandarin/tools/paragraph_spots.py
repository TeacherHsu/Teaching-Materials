"""把每一筆段落大意對到課文密文的句子位置（給「一段一段讀」用）。

存的是 text_spots：[{para, sentences, sha}]，和閱讀證據同一種格式——
只有位置和雜湊，不存課文文字；顯示時從密文取，要教室密碼。

三種對位方式，依課選用（對不上的課就不寫，不猜）：
  reading  密文課文本身的分段就是課本的段（二上大多如此、四上詩歌）
  doc      官方課文 Word 檔自動對位：去掉標點空白後依字元位置，把每一句歸到它所在的段
  manual   人工標的句子範圍（六上 Word 檔的對話每行都拆成一段，自動對位不可靠）

用法（在 apps/mandarin 下，需要 ~/mandarin-work 與教室密碼解開的密文）：
    python3 tools/paragraph_spots.py
"""
import json, os, re, subprocess, zipfile, glob

BASE = os.path.expanduser('~/Library/CloudStorage/OneDrive-個人/mandarin-work')
HAN = re.compile(r'[一-鿿]')
CN = '一二三四五六七八九十'


def cn2int(s):
    if s == '十':
        return 10
    if s.startswith('十'):
        return 10 + CN.index(s[1]) + 1
    if '十' in s:
        a, b = s.split('十')
        return (CN.index(a) + 1) * 10 + (CN.index(b) + 1 if b else 0)
    return CN.index(s) + 1


def reading_sentences(lesson_id):
    """[(para, idx, sha, text)] 依課文順序。"""
    out = subprocess.run(['node', 'tools/reading_evidence.mjs', 'list', lesson_id],
                         capture_output=True, text=True).stdout
    rows, para = [], None
    for line in out.splitlines():
        m = re.match(r'【第 (\d+) 段】', line.strip())
        if m:
            para = int(m.group(1)); continue
        m = re.match(r'\s*(\d+)\s+([0-9a-f]{8})\s+(.*)$', line)
        if m and para:
            rows.append((para, int(m.group(1)), m.group(2), m.group(3)))
    return rows


def norm(s):
    return ''.join(HAN.findall(s))


def doc_paragraphs(lesson_id):
    vol, no = lesson_id[:7], int(lesson_id[7:])
    if vol == '115AG4K':
        d = f'{BASE}/115AG4K/raw/大補帖/01.基本備課/03.國語4上課文word檔'
        f = next((x for x in os.listdir(d) if f'第{no:02d}課' in x), None)
        if not f:
            return None
        txt = subprocess.run(['textutil', '-convert', 'txt', '-stdout', f'{d}/{f}'], capture_output=True, text=True).stdout
        paras = [m.group(2) for m in (re.match(rf'^([{CN}]+)[　 ]+(.*)$', l.strip()) for l in txt.splitlines()) if m]
        return paras or None
    rel = {'115AG6H': '115AG6H/raw/大補帖/1.備課資料/01課文word檔', '115AG2H': '115AG2H/raw/大補帖/1.備課資料/01課文word檔', '115AG3H': '115AG3H/raw/大補帖/1.備課資料/01課文word檔'}[vol]
    xml = zipfile.ZipFile(glob.glob(f'{BASE}/{rel}/*.docx')[0]).read('word/document.xml').decode()
    cur, paras = None, []
    for p in re.findall(r'<w:p\b.*?</w:p>', xml, re.S):
        p = re.sub(r'<w:rt>.*?</w:rt>', '', p, flags=re.S)
        t = ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S)).strip()
        if not t:
            continue
        m = re.match(rf'^第([{CN}]+)課', t)
        if m:
            cur = cn2int(m.group(1)); continue
        if re.match(r'^(來閱讀|閱讀階梯|愛閱讀|統整|語文天地)', t):
            cur = None; continue
        if cur == no:
            # 去掉小標題、稱呼、署名（短、沒有句中標點）
            if len(t) <= 12 and not re.search(r'[，。！？、；」]', t):
                continue
            if re.fullmatch(r'.{1,4}：', t):
                continue
            paras.append(t)
    return paras


def align_doc(rows, paras):
    """回傳 {段號: [(para, idx, sha)]}；對不上回 None。"""
    stream, offsets = '', []
    for para, idx, sha, text in rows:
        offsets.append(len(stream)); stream += norm(text)
    starts, pos = [], 0
    for p in paras:
        # Word 檔和密文偶有一字之差（四上 L03 第四段 Word 是「逼」、課文是「蹦」），
        # 開頭找不到就往後挪幾個字再找，找到後換算回段首位置。
        text, at = norm(p), -1
        for skip in (0, 4, 8, 12):
            head = text[skip:skip + 8]
            if len(head) < 6:
                break
            found = stream.find(head, pos)
            if found >= 0:
                at = max(pos, found - skip); break
        if at < 0:
            return None
        starts.append(at); pos = at + 1
    starts.append(len(stream) + 1)
    out = {}
    for k in range(len(paras)):
        out[k + 1] = [(r[0], r[1], r[2]) for r, off in zip(rows, offsets) if starts[k] <= off < starts[k + 1]]
    return out


def spots_of(items):
    groups = {}
    for para, idx, sha in items:
        g = groups.setdefault(para, {'para': para, 'sentences': [], 'sha': []})
        g['sentences'].append(idx); g['sha'].append(sha)
    return list(groups.values())


# ── 人工標的句子範圍：{課次: [每筆大意的 [(段, 起句, 迄句), ...]]}，依大意順序
MANUAL = {
    '115AG3H01': [[(1, 0, 3)], [(2, 0, 4)], [(3, 0, 5)], [(4, 0, 2)], [(5, 0, 2)]],
    '115AG3H06': [[(1, 0, 1)], [(2, 0, 3)], [(4, 0, 6)], [(5, 0, 11)], [(7, 0, 4)], [(8, 0, 4)], [(9, 0, 2)]],
    '115AG3H07': [[(1, 0, 3)], [(2, 0, 3)], [(3, 0, 3)], [(4, 0, 3)], [(5, 0, 3)]],
    '115AG3H08': [[(p, 0, 9) for p in range(5, 15)], [(p, 0, 9) for p in range(20, 32)], [(p, 0, 9) for p in range(37, 45)]],
    '115AG3H10': [[(1, 0, 0), (2, 0, 6)], [(3, 0, 9)], [(4, 0, 8)], [(5, 0, 11)], [(6, 0, 2)]],
    '115AG2H06': [[(2, 0, 9)], [(3, 0, 7)], [(4, 0, 6)]],
    '115AG2H11': [[(1, 1, 4)], [(2, 0, 5), (3, 0, 7), (4, 0, 2)], [(4, 3, 4)]],
    '115AG2H12': [[(1, 1, 8)], [(1, 9, 10)], [(2, 0, 6)], [(3, 0, 10)], [(3, 11, 12)]],
    '115AG4K11': [[(2, 0, 9)], [(2, 10, 36)], [(2, 37, 56)], [(2, 57, 99)], [(2, 100, 123)]],
    '115AG6H01': [[(1, 1, 7)], [(2, 0, 8)], [(3, 0, 5)], [(4, 1, 18)]],
    '115AG6H03': [[(1, 1, 15)], [(1, 16, 34), (2, 0, 24)], [(2, 25, 42)]],
    '115AG6H06': [[(1, 2, 20)], [(1, 21, 36)], [(1, 37, 46)], [(1, 47, 51)], [(1, 52, 64)], [(1, 65, 79)]],
    '115AG6H07': [[(1, 1, 18)], [(1, 19, 55)], [(1, 56, 71)], [(1, 72, 79)], [(1, 80, 107)]],
    '115AG6H09': [[(1, 1, 20)], [(1, 21, 56)], [(1, 57, 93)], [(1, 94, 112)], [(1, 113, 128)], [(1, 129, 134)]],
    '115AG6H10': [[(1, 1, 7)], [(2, 1, 9)], [(4, 1, 19)]],
    '115AG6H12': [[(1, 1, 11)], [(1, 12, 32)], [(1, 33, 36)], [(1, 37, 95)], [(1, 96, 114)], [(1, 115, 132)], [(1, 133, 141)]],
}
# 密文分段就是課本分段：{課次: 段號位移}（四上 L10 第 1 段是故事便利貼，課本段 k ＝ 密文段 k+1）
READING_OFFSET = {'115AG4K10': 1}


def main():
    report = []
    for f in sorted(glob.glob('public/data/115AG[2346]*/lesson*.json')):
        lesson = json.load(open(f))
        lid = lesson['lesson_id']
        entries = lesson.get('paragraph_summary') or []
        if not entries:
            continue
        rows = reading_sentences(lid)
        if not rows:
            report.append((lid, '沒有課文密文')); continue
        title = (lesson.get('title') or '').strip()
        # 課名、子篇標題（「（二）種樹」）、信末署名（「爸爸」）不算段落內容
        last = rows[-1] if rows else None
        body = [r for r in rows
                if not (r[1] == 0 and r[3].rstrip('。') == title)
                and not re.match(r'^（[一二三四五六七八九十]+）', r[3])
                and not (r is last and len(norm(r[3])) <= 3 and not re.search(r'[，。！？」]', r[3]))]
        body_keys = {(r[0], r[1]) for r in body}
        by_para = {}
        for r in body:
            by_para.setdefault(r[0], []).append((r[0], r[1], r[2]))
        assigned = None
        method = ''
        if lid in MANUAL and len(MANUAL[lid]) == len(entries):
            lookup = {(r[0], r[1]): r[2] for r in rows}
            assigned = [[(p, i, lookup[(p, i)]) for p, a, b in spans for i in range(a, b + 1) if (p, i) in body_keys]
                        for spans in MANUAL[lid]]
            method = 'manual'
        elif lid.startswith('115AG2H') and len(by_para) == len(entries):
            assigned = [by_para[p] for p in sorted(by_para)]
            method = 'reading'
        elif lid == '115AG4K01' and len(by_para) == 6:
            # 兩首詩各三段：游泳 1–3 → 密文段 1–3；溜直排輪 1–3 → 密文段 4–6
            keys = sorted(by_para)
            assigned = [by_para[keys[(3 if e.get('section') == '溜直排輪' else 0) + e['paragraph_no'] - 1]] for e in entries]
            method = 'reading'
        elif lid in READING_OFFSET:
            off = READING_OFFSET[lid]
            keys = sorted(by_para)
            try:
                assigned = [[x for n in range(e['paragraph_no'], (e.get('paragraph_span') or [e['paragraph_no']] * 2)[1] + 1)
                             for x in by_para[keys[n - 1 + off]]] for e in entries]
                method = 'reading'
            except (IndexError, KeyError):
                assigned = None
        else:
            paras = doc_paragraphs(lid)
            want = max(((e.get('paragraph_span') or [None, e.get('paragraph_no')])[1] or 0) for e in entries)
            sections = [e.get('section') for e in entries]
            if paras and lid == '115AG6H05':
                want = 11   # 觀樹 6 段＋種樹 5 段
            if paras and len(paras) == want:
                mapping = align_doc(body, paras)
                if mapping:
                    assigned = []
                    for e in entries:
                        a = e['paragraph_no']; b = (e.get('paragraph_span') or [a, a])[1]
                        shift = 6 if e.get('section') == '種樹' else 0
                        assigned.append([x for n in range(a, b + 1) for x in mapping[n + shift]])
                    method = 'doc'
        if not assigned or any(not a for a in assigned):
            report.append((lid, f'略過（{len(entries)} 筆大意對不上課文分段）')); continue
        for e, items in zip(entries, assigned):
            e['text_spots'] = spots_of(items)
        json.dump(lesson, open(f, 'w'), ensure_ascii=False, indent=2)
        report.append((lid, f'{method}：{len(entries)} 筆'))
    for lid, msg in report:
        print(lid, msg)


if __name__ == '__main__':
    main()
