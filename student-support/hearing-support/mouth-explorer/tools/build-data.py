#!/usr/bin/env python3
"""由教育部《重編國語辭典修訂本》公眾授權資料產生 zhuyin-data.js。

來源：g0v/moedict-data 的 dict-revised.json（教育部《重編國語辭典修訂本》，
創用CC 姓名標示-禁止改作 3.0 臺灣；依教育部解釋，改作限制的是文字資料本身，
不限制格式轉換與後續應用）。本腳本只擷取「字／詞 → 注音」，不改動任何讀音。

用法：python3 tools/build-data.py /path/to/dict-revised.json
"""
import json, re, sys, collections

SYL = re.compile(r'^[ㄅ-ㄩ]+[ˊˇˋ]?$|^˙[ㄅ-ㄩ]+$')
CJK = re.compile(r'^[一-鿿]+$')
# 常用虛詞：從辭典已收錄的讀音中，指定口語最常用的那一個當預設（讀音本身仍出自辭典）
PREFER = {'的': '˙ㄉㄜ', '了': '˙ㄌㄜ', '著': '˙ㄓㄜ', '和': 'ㄏㄢˋ', '嗎': '˙ㄇㄚ', '呢': '˙ㄋㄜ',
          '吧': '˙ㄅㄚ', '們': '˙ㄇㄣ', '麼': '˙ㄇㄜ', '子': 'ㄗˇ', '地': 'ㄉㄧˋ', '得': 'ㄉㄜˊ',
          '個': 'ㄍㄜˋ', '啊': '˙ㄚ', '還': 'ㄏㄞˊ', '都': 'ㄉㄡ', '要': 'ㄧㄠˋ', '為': 'ㄨㄟˋ',
          '大': 'ㄉㄚˋ', '好': 'ㄏㄠˇ', '看': 'ㄎㄢˋ', '會': 'ㄏㄨㄟˋ', '長': 'ㄔㄤˊ', '什': 'ㄕㄣˊ'}

def sylls(b):
    b = re.split('[，；（]', b)[0].strip()
    parts = b.split()
    return parts if parts and all(SYL.match(p) for p in parts) else None

def main(path):
    d = json.load(open(path, encoding='utf-8'))
    listed = collections.OrderedDict()      # 字 → 辭典列出的讀音
    words = {}                              # 詞 → 讀音（取第一個）
    for e in d:
        t = e['title']
        if not CJK.match(t): continue
        for h in e.get('heteronyms', []):
            s = sylls(h.get('bopomofo') or '')
            if not s or len(s) != len(t): continue
            if len(t) == 1:
                listed.setdefault(t, [])
                if s[0] not in listed[t]: listed[t].append(s[0])
            elif t not in words:
                words[t] = s
    usage = collections.defaultdict(collections.Counter)
    for t, s in words.items():
        for c, r in zip(t, s): usage[c][r] += 1
    chars = {}
    for c, rs in listed.items():
        cnt = usage[c]
        order = sorted(rs, key=lambda r: (-cnt[r], rs.index(r)))
        p = PREFER.get(c)
        if p:
            assert p in rs, (c, p, rs)
            order.remove(p); order.insert(0, p)
        chars[c] = order
    # 只保留「照單字預設讀音會念錯」的 2–4 字詞
    keep = {}
    for t, s in words.items():
        if not 2 <= len(t) <= 4: continue
        if any(c not in chars for c in t): continue
        if any(chars[c][0] != r for c, r in zip(t, s)):
            keep[t] = ' '.join(s)
    # 注音符號的「念法示範字」：挑只有一個讀音、且在最多詞裡出現的字，給語音合成念
    NAMES = {}
    for z in 'ㄅㄆㄇㄈ': NAMES[z] = z + 'ㄛ'
    for z in 'ㄉㄊㄋㄌㄍㄎㄏ': NAMES[z] = z + 'ㄜ'
    for z in 'ㄐㄑㄒ': NAMES[z] = z + 'ㄧ'
    for z in 'ㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ': NAMES[z] = z
    total = {c: sum(usage[c].values()) for c in chars}
    speak = {}
    for z, base in NAMES.items():
        for tone in ['', 'ˋ', 'ˊ', 'ˇ']:
            cand = [c for c, rs in chars.items() if rs == [base + tone]]
            cand = [c for c in cand if total[c] >= 15]   # 太冷僻的字語音合成常念不出來，寧可不給
            if cand:
                speak[z] = max(cand, key=lambda c: total[c]); break
    out = {'s': speak, 'c': ';'.join(c + ','.join(rs) for c, rs in chars.items()),
           'w': ';'.join(t + ' ' + s for t, s in keep.items())}
    js = ('/* 自動產生，請勿手改。來源：教育部《重編國語辭典修訂本》（CC BY-ND 3.0 臺灣），'
          '經 g0v/moedict-data 轉為 JSON；本檔只擷取字詞與注音。產生方式見 tools/build-data.py */\n'
          'window.ZHUYIN_DATA=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    open('zhuyin-data.js', 'w', encoding='utf-8').write(js)
    print('chars', len(chars), 'words', len(keep), 'bytes', len(js.encode()))
    print(speak)
    for c in '的了和行長好樂重一不垃圾': print(c, chars.get(c))
    for w in ['銀行', '音樂', '快樂', '垃圾', '長大', '睡覺', '覺得', '朋友', '漂亮', '頭髮', '星期']: print(w, keep.get(w, '(預設)'))

main(sys.argv[1])
