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
        # hint 可以是一句（只給第 1 層）或 (第1層, 第2層) ——第 2 層是「教怎麼找」，
        # 通常是說出結構區塊，例如「答案在『練習』那一塊裡」。不給就用通用句。
        first, locate = (hint, None) if isinstance(hint, str) else (hint[0], hint[1])
        hints = [{'level': 1, 'text': first}]
        hints.append({'level': 2, 'type': 'locate', **({'text': locate} if locate else {})})
        hints.append({'level': 3, 'type': 'evidence'})
        question['hints'] = hints

    json.dump(lesson, open(path, 'w'), ensure_ascii=False, indent=2)
    print(f'已寫入 {path}（{len(annotations)} 題）')


def replace_questions(lesson_id, filename, genre, questions, source):
    """整組換掉一課的閱讀理解題（原創布題用）。

    questions: [{stem, options, answer, tag, evidence, hint, locate}]
      - options 第一個不必是答案，前端會洗牌；但 answer 一定要在 options 裡。
      - evidence 寫法同 apply()。
      - hint 是第 1 層（看不到課文時給，說「去哪裡找」），
        locate 是第 2 層（打開證據面板時給，句子線索）。
    原創題一律 status: draft，要教師核准才上線。
    """
    path = f'public/data/{lesson_id[:7]}/{filename}'
    lesson = json.load(open(path))
    table = hashes(lesson_id)
    paras = {key[0] for key in table}
    if genre:
        lesson['genre'] = genre
    built = []
    for index, q in enumerate(questions, 1):
        if q['answer'] not in q['options']:
            raise SystemExit(f'{lesson_id} 第 {index} 題：答案不在選項裡')
        if len(set(q['options'])) != len(q['options']):
            raise SystemExit(f'{lesson_id} 第 {index} 題：選項重複')
        groups = q['evidence']
        if groups and not isinstance(groups[0], tuple):
            if len(paras) != 1:
                raise SystemExit(f'{lesson_id} 第 {index} 題：課文有 {len(paras)} 段，必須寫明段號')
            groups = [(next(iter(paras)), groups)]
        for hint_text in (q['hint'], q['locate']):
            if q['answer'] in hint_text:
                raise SystemExit(f'{lesson_id} 第 {index} 題：提示直接寫出答案')
        built.append({
            'id': f'reading_question:{lesson_id[-2:]}:{index:02d}',
            'stem': q['stem'],
            'options': q['options'],
            'answer': q['answer'],
            'status': 'draft',
            'source': source,
            'answer_source': 'authored:依課文證據句布題（證據見 evidence 欄）',
            'strategy_tag': q['tag'],
            'evidence': [
                {'para': para, 'sentences': rows, 'sha': [table[(para, row)] for row in rows]}
                for para, rows in groups
            ],
            'hints': [
                {'level': 1, 'text': q['hint']},
                {'level': 2, 'type': 'locate', 'text': q['locate']},
                {'level': 3, 'type': 'evidence'},
            ],
        })
    lesson['reading_questions'] = built
    json.dump(lesson, open(path, 'w'), ensure_ascii=False, indent=2)
    print(f'已寫入 {path}（{len(built)} 題，draft）')
