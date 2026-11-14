#!/usr/bin/env python3
"""朗讀遊戲題庫產生器：從課文樂園課次資料抽出生字與語詞，配上注音與同音字表。

用法（在 repo 根目錄）：
    python3 Chinese/Read-Aloud/tools/build_data.py           # 產生 data/<代號>.js
    python3 Chinese/Read-Aloud/tools/build_data.py --check   # 只檢查產物是否最新

data/*.js 是產物，不要手改。注音只取自：課次資料 → zhuyin-supplement.json；
缺讀音就停下來（不猜）。同音字表（辨識結果比對用）需要兩個 repo 外的檔案，
只有家中 Mac 有：
    ~/sped-os/30-materials/worksheets/kewen_fuxi/bpmf/phonic_table_v1.500.txt
    ~/mandarin-work/moe-dict/concised_lexicon_2014_20260929.json
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OUT_DIR = HERE.parent / 'data'
LESSON_DIR = ROOT / 'apps/mandarin/public/data'
PHONIC = Path.home() / 'sped-os/30-materials/worksheets/kewen_fuxi/bpmf/phonic_table_v1.500.txt'
LEXICON = Path.home() / 'mandarin-work/moe-dict/concised_lexicon_2014_20260929.json'

# 代號 → 冊別、課次範圍、顯示名稱、年級頁網址
SETS = {
    # taught_only：一年級識字量少，生字的造詞只用「每個字都教過（本冊到這一課為止）」的詞
    'G1A': {'volume': '115AG1H', 'from': 1, 'to': 7, 'label': '翰林一上', 'grade': 1, 'taught_only': True},
    'G2A': {'volume': '115AG2H', 'from': 1, 'to': 6, 'label': '翰林二上', 'grade': 2},
    'G2A2': {'volume': '115AG2H', 'from': 7, 'to': 12, 'label': '翰林二上', 'grade': 2},
    'G3A': {'volume': '115AG3H', 'from': 1, 'to': 6, 'label': '翰林三上', 'grade': 3},
    'G3A2': {'volume': '115AG3H', 'from': 7, 'to': 12, 'label': '翰林三上', 'grade': 3},
    'G4A': {'volume': '115AG4K', 'from': 1, 'to': 6, 'label': '康軒四上', 'grade': 4},
    'G4A2': {'volume': '115AG4K', 'from': 7, 'to': 12, 'label': '康軒四上', 'grade': 4},
    'G6A': {'volume': '115AG6H', 'from': 1, 'to': 6, 'label': '翰林六上', 'grade': 6},
    'G6A2': {'volume': '115AG6H', 'from': 7, 'to': 12, 'label': '翰林六上', 'grade': 6},
}

TONE = re.compile('[ˊˇˋ˙]')
HAN = re.compile('[㐀-鿿]')
toneless = lambda z: TONE.sub('', z)

# 容易混淆的音：只給「很接近」，不算念對
INITIAL_PAIRS = [('ㄓ', 'ㄗ'), ('ㄔ', 'ㄘ'), ('ㄕ', 'ㄙ'), ('ㄋ', 'ㄌ'), ('ㄖ', 'ㄌ')]
FINAL_PAIRS = [('ㄣ', 'ㄥ'), ('ㄢ', 'ㄤ')]


def near_syllables(s):
    out = set()
    for a, b in INITIAL_PAIRS:
        for x, y in ((a, b), (b, a)):
            if s.startswith(x):
                out.add(y + s[1:])
    for a, b in FINAL_PAIRS:
        for x, y in ((a, b), (b, a)):
            if s.endswith(x):
                out.add(s[:-1] + y)
    out.discard(s)
    return out


INIT, MED, FIN, TONES = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ', 'ㄧㄨㄩ', 'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ', 'ˊˇˋ'


def split_syllables(z):
    """注音串切成音節。有空格就照空格切；沒有（康軒資料）就照聲母／介音／韻母／聲調切。
    輕聲符號「˙」寫在前面或後面都接受，一律整理成寫在前面。"""
    z = ''.join(ch for ch in z if ch in INIT + MED + FIN + TONES + '˙ ').strip()   # 去掉 ® 之類的符號
    if ' ' in z:
        return z.split()
    out, i, n = [], 0, len(z)
    while i < n:
        light = z[i] == '˙'
        i += light
        cur = ''
        for group in (INIT, MED, FIN):
            if i < n and z[i] in group:
                cur += z[i]
                i += 1
        if not cur:
            return []          # 看不懂的字元：交給呼叫端當成「沒有讀音」
        if i < n and z[i] in TONES:
            cur += z[i]
            i += 1
        elif not light and i < n and z[i] == '˙' and (i + 1 == n or z[i + 1] not in INIT + MED + FIN):
            light = True       # 輕聲寫在後面（ㄗ˙）
            i += 1
        out.append(('˙' if light else '') + cur)
    return out


def die(msg):
    sys.exit(f'✗ {msg}')


def load_tables():
    if not PHONIC.exists() or not LEXICON.exists():
        die(f'找不到讀音表或簡編本詞庫（只有家中 Mac 有）：\n  {PHONIC}\n  {LEXICON}')
    table = {}
    for line in PHONIC.read_text(encoding='utf-8').split('\n'):
        f = line.split('\t')
        if len(f) >= 4:
            table[f[0]] = [x.strip() for x in f[3:] if x.strip()]
    lex = json.loads(LEXICON.read_text(encoding='utf-8'))
    return table, lex


def build(code, cfg, table, lex, supplement, say):
    lex_words, lex_amb = lex['words'], lex['ambiguous']
    common = {ch for w in lex_words for ch in w if HAN.match(ch)}
    lessons, problems = [], []
    taught, set_words = set(), {}
    for no in range(cfg['from'], cfg['to'] + 1):
        L = json.loads((LESSON_DIR / cfg['volume'] / f'lesson{no:02d}.json').read_text(encoding='utf-8'))
        ok = lambda x: x.get('status') in ('ready', 'approved')

        def word_syl(w, own=None):
            z = own or (supplement.get(w) or {}).get('zhuyin')
            if not z and w in lex_words and w not in lex_amb:
                z = lex_words[w]
            syl = split_syllables(z) if z else []
            return syl if len(syl) == len(w) else None

        words = []
        for w in filter(ok, L['words']):
            text = ''.join(ch for ch in w['word'] if HAN.match(ch))   # 去掉 ® 之類的符號，只留要念的字
            syl = word_syl(text, w.get('zhuyin'))
            if not syl:
                problems.append(f"第{no}課語詞「{w['word']}」沒有讀音，請補進 zhuyin-supplement.json")
                continue
            words.append({'t': text, 'z': syl})
        lesson_words = {w['t']: w['z'] for w in words}
        set_words.update(lesson_words)
        taught.update(c['char'] for c in filter(ok, L['characters']))

        chars = []
        for c in filter(ok, L['characters']):
            ch, z = c['char'], (c.get('zhuyin') or '').strip()
            if not z or ' ' in z:
                problems.append(f'第{no}課生字「{ch}」讀音有問題：{z!r}')
                continue
            item = {'t': ch, 'z': [z]}
            # 造詞：先用本課語詞，再用生字資料的造詞；只收「查得到讀音、而且這個字的讀音和生字一致」的
            cands = [w for w in lesson_words if ch in w] + list(c.get('examples') or [])
            if cfg.get('taught_only'):
                cands = ([w for w in lesson_words if ch in w] + [w for w in set_words if ch in w]
                         + [w for w in (c.get('examples') or []) if all(x in taught for x in w)])
            for w in cands:
                syl = set_words.get(w) or word_syl(w)
                if len(w) >= 2 and syl and ch in w and syl[w.index(ch)] == z:
                    item['ex'], item['exz'] = w, syl
                    break
            chars.append(item)
        lessons.append({'no': no, 'title': L['title'], 'chars': chars, 'words': words})
    for L in lessons:
        for it in L['chars'] + L['words']:
            alt = say.get(it['t'])
            own = alt['say'] if isinstance(alt, dict) and alt['zhuyin'].split() == it['z'] else None
            ex_alt = say.get(it.get('ex', ''))
            if isinstance(ex_alt, dict) and ex_alt['zhuyin'].split() == it['exz']:
                it['s'] = f"{ex_alt['say']}的{own or it['t']}"   # 造詞裡有要代念的字
            elif own:
                it['s'] = own
    if problems:
        die('\n  '.join(['資料有缺：'] + problems))

    # 同音字表：辨識器挑了哪個同音字不是學生的錯（同課文樂園「不比聲調、同音字算對」）
    by_syl = {}
    for ch, readings in table.items():
        if ch in common:
            for r in readings:
                by_syl.setdefault(toneless(r), set()).add(ch)
    targets = set()
    for L in lessons:
        for it in L['chars'] + L['words']:
            targets.update(toneless(s) for s in it['z'] + it.get('exz', []))
    homo = {s: ''.join(sorted(by_syl.get(s, ()))) for s in sorted(targets)}
    near = {}
    for s in sorted(targets):
        chars = set().union(*(by_syl.get(n, set()) for n in near_syllables(s))) - set(homo[s])
        if chars:
            near[s] = ''.join(sorted(chars))
    return {'code': code, 'label': cfg['label'], 'grade': cfg['grade'], 'from': cfg['from'], 'to': cfg['to'],
            'lessons': lessons, 'homo': homo, 'near': near}


def main():
    check = '--check' in sys.argv
    table, lex = load_tables()
    sup = json.loads((HERE / 'zhuyin-supplement.json').read_text(encoding='utf-8'))
    supplement, say = sup['words'], sup.get('say', {})
    bad = False
    for code, cfg in SETS.items():
        data = build(code, cfg, table, lex, supplement, say)
        text = ('// 產物：由 tools/build_data.py 產生，不要手改。\n'
                'window.READ_ALOUD_DATA = window.READ_ALOUD_DATA || {};\n'
                f'window.READ_ALOUD_DATA[{json.dumps(code)}] = '
                + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
        out = OUT_DIR / f'{code}.js'
        n_c = sum(len(L['chars']) for L in data['lessons'])
        n_w = sum(len(L['words']) for L in data['lessons'])
        no_ex = [c['t'] for L in data['lessons'] for c in L['chars'] if 'ex' not in c]
        if check:
            same = out.exists() and out.read_text(encoding='utf-8') == text
            print(f"{'✅' if same else '✗'} {code}：{n_c} 個生字、{n_w} 個語詞" + ('' if same else '（產物不是最新，請重跑 build_data.py）'))
            bad |= not same
        else:
            out.write_text(text, encoding='utf-8')
            print(f'✅ {code}：{n_c} 個生字、{n_w} 個語詞 → {out.relative_to(ROOT)}（{len(text.encode()) // 1024} KiB）')
            if no_ex:
                print(f'   沒有可用造詞的生字（只念單字）：{"".join(no_ex)}')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
