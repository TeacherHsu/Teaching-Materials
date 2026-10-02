"""標閱讀證據用的輔助函式。

用法（在 apps/mandarin 下）：

    python3 - <<'EOF'
    import sys; sys.path.insert(0, 'tools')
    from annotate_evidence import apply
    apply('115AG4K05', 'lesson05.json', 'argument', {
        0: ('推論訊息', [21, 22, 23], '第一層提示的文字'),
        1: ('提取訊息', [(3, [4, 5])], '多段課文要寫明段號'),
    })
    EOF

雜湊一律從 `reading_evidence.mjs list` 現場取，不從記憶填——憑印象寫雜湊
踩過一次（標了一個不存在的值，check 才抓出來）。

句子序號是**每段從 0 重新算**的，所以多段課文一定要寫明段號；單段課文才允許
只給序號。這是另一個踩過的坑：對照表原本只用序號當 key，多段課文後面的段會
蓋掉前面的段，L10（六段）、L11（兩段）都中過。
"""
import json
import re
import subprocess


def hashes(lesson_id):
    """回傳 {(段號, 句序): 雜湊}。"""
    out = subprocess.run(
        ['node', 'tools/reading_evidence.mjs', 'list', lesson_id],
        capture_output=True, text=True, check=True,
    ).stdout
    table = {}
    para = 1
    for line in out.splitlines():
        header = re.match(r'【第 (\d+) 段】', line.strip())
        if header:
            para = int(header.group(1))
            continue
        row = re.match(r'\s*(\d+)\s+([0-9a-f]{8})\s', line)
        if row:
            table[(para, int(row.group(1)))] = row.group(2)
    if not table:
        raise SystemExit(f'{lesson_id}: 取不到課文句子（課文可能不在密文裡，或代號打錯）')
    return table


def apply(lesson_id, filename, genre, annotations):
    """annotations: {題目索引: (策略標籤, 證據, 第一層提示)}

    證據可以是 [句序, ...]（單段課文）或 [(段號, [句序, ...]), ...]。
    genre 傳 None 表示不動原有文體。
    """
    path = f'public/data/{lesson_id[:7]}/{filename}'
    lesson = json.load(open(path))
    table = hashes(lesson_id)
    paras = {key[0] for key in table}
    if genre:
        lesson['genre'] = genre

    for index, (tag, evidence, hint) in annotations.items():
        question = lesson['reading_questions'][index]
        if question.get('data_issue'):
            raise SystemExit(f'{lesson_id} 第 {index + 1} 題還有待裁定的疑義，不該標證據')
        groups = evidence
        if groups and not isinstance(groups[0], tuple):
            if len(paras) != 1:
                raise SystemExit(f'{lesson_id} 第 {index + 1} 題：課文有 {len(paras)} 段，必須寫明段號')
            groups = [(next(iter(paras)), groups)]
        question['strategy_tag'] = tag
        question['evidence'] = [
            {'para': para, 'sentences': rows, 'sha': [table[(para, row)] for row in rows]}
            for para, rows in groups
        ]
        question['hints'] = [
            {'level': 1, 'text': hint},
            {'level': 2, 'type': 'locate'},
            {'level': 3, 'type': 'evidence'},
        ]

    json.dump(lesson, open(path, 'w'), ensure_ascii=False, indent=2)
    print(f'已寫入 {path}（{len(annotations)} 題）')
