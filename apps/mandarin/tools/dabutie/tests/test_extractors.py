"""單元測試：全部用合成小 fixture（虛構課文「花花」/「小明」），不含大補帖原文。"""
from extractors import (
    idioms as ex_idioms,
    phrases_sentences as ex_phrases,
    reading_questions as ex_reading_questions,
    rhetoric as ex_rhetoric,
    sentence_patterns as ex_sentence_patterns,
    structure_map as ex_structure_map,
    summary as ex_summary,
)
from extractors.characters import parse_table
from extractors.word_meanings import parse_meaning_cell
from common import cn_to_int, lesson_cn, split_two_columns


def test_lesson_cn_roundtrip():
    assert lesson_cn(1) == "一"
    assert lesson_cn(10) == "十"
    assert lesson_cn(12) == "十二"
    assert cn_to_int("一") == 1
    assert cn_to_int("十") == 10
    assert cn_to_int("十二") == 12
    assert cn_to_int("十一") == 11


def test_characters_parse_table():
    table = [
        ["115三上(第五冊)"],
        ["課次", "習寫字", "認讀字"],
        ["一", "花明亮跳", ""],
        ["二", "笑走跑", "藍"],
    ]
    r1 = parse_table(table, 1)
    assert r1["basic_chars"] == list("花明亮跳")
    assert r1["extended_chars"] == []
    r2 = parse_table(table, 2)
    assert r2["extended_chars"] == ["藍"]


def test_word_meanings_split_short_word_vs_long_sentence():
    text = "1.高興。例快樂\n2.完整的一句話沒有分隔符所以會判定為需改寫的句子。"
    senses = parse_meaning_cell(text)
    assert senses[0]["examples"] == ["快樂"]
    # 第二義項沒有「例」，仍要能解析出定義
    assert "句子" in senses[1]["definition"]


def test_word_meanings_long_example_goes_to_sentences_not_examples():
    text = "1.代詞。例他撿到一顆星星，把它放進口袋裡。"
    senses = parse_meaning_cell(text)
    assert senses[0]["examples"] == []
    assert senses[0]["sentences"]


def test_idioms_two_column_pdf_layout():
    lines = split_two_columns(
        "                              2.   一心一意：專心一意，形容做事專注。\n"
        "1.   分秒必爭：形容珍惜時間，抓緊每分每秒不浪費。\n"
        "                              ★ 他讀書時一心一意，不受外界干擾。\n"
        " 近義 全神貫注\n"
        "★ 田徑選手在賽場上分秒必爭，全力衝刺。\n"
    )
    items = ex_idioms.parse_lines(lines, related_chars=["秒", "意"])
    assert [it["idiom"] for it in items] == ["分秒必爭", "一心一意"]
    assert items[0]["sentences"] == ["田徑選手在賽場上分秒必爭，全力衝刺。"]
    assert items[1]["related"] == "意"


def test_phrases_sentences_sections():
    text = "\n".join([
        "第一課　花花與小明",
        "一、短語練習",
        " ◎跑得實在太快了",
        "  結構：動詞＋得＋形容詞",
        "  說明：測試用說明。",
        "  ⑴寫得實在太好了",
        "  ⑵吃得實在太飽了",
        "二、造句練習",
        " ⒈開心",
        "  說明：測試造句說明。",
        "  ⑴他今天很開心。",
        "三、句型練習",
        " ◎小明一邊唱歌，一邊跳舞。",
        "  結構：（誰）一邊（做什麼），一邊（做什麼）。",
        "  ⑴姊姊一邊寫字，一邊聽音樂。",
    ])
    sections = ex_phrases.parse_lines(text.split("\n"))
    assert len(sections["短語練習"]) == 1
    assert sections["短語練習"][0]["examples"] == ["寫得實在太好了", "吃得實在太飽了"]
    assert len(sections["造句練習"]) == 1
    assert sections["句型練習"][0]["structure"] == "（誰）一邊（做什麼），一邊（做什麼）。"


def test_sentence_patterns_reverse_lookup_by_lesson():
    text = "\n".join([
        "並列複句",
        "定義用不同句子描寫同時存在的情況。",
        "例句",
        "花花一邊唱歌，一邊跳舞。（第一課）",
        "小明一邊跑步，一邊喘氣。（第三課）",
        "",
        "因果複句",
        "定義前果後因或前因後果。",
        "例句",
        "因為下雨，所以他撐傘。（第一課）",
    ])
    items = ex_sentence_patterns.parse_text(text)
    l1 = [it for it in items if it["lesson_no"] == 1]
    assert len(l1) == 2
    assert {it["category"] for it in l1} == {"並列複句", "因果複句"}


def test_rhetoric_reverse_lookup_by_lesson():
    paragraphs = [
        "譬喻",
        "定義找相似點來說明的修辭法。",
        "例句",
        "1.時間像小偷（第一課）",
        "2.笑容像花朵（第二課）",
    ]
    items = ex_rhetoric.parse_paragraphs(paragraphs)
    l1 = [it for it in items if it["lesson_no"] == 1]
    assert len(l1) == 1
    assert l1[0]["figure"] == "譬喻"
    assert l1[0]["example"] == "時間像小偷"


def test_summary_extracts_target_lesson_only():
    paragraphs = [
        "第一課　花花與小明",
        "主旨：測試主旨。",
        "課文大意：測試大意。",
        "段落大意",
        "第一段：第一段測試。",
        "第二段：第二段測試接續",
        "續完。",
        "第二課　另一課",
        "主旨：不應該被抓到。",
        "課文大意：不應該被抓到。",
    ]
    data = ex_summary.parse_paragraphs(paragraphs, target_lesson_no=1)
    assert data["theme"] == "測試主旨。"
    assert data["gist"] == "測試大意。"
    assert len(data["paragraphs"]) == 2
    assert data["paragraphs"][1]["summary"] == "第二段測試接續續完。"


def test_structure_map_assigns_role_to_preceding_items():
    text = "\n".join([
        "             1.   花花說了一句話。",
        "             2.   小明也說了一句話。",
        "        分說",
        "花花與小明",
        "             3.   最後大家一起說話。",
        "        總說   4.   結束。",
    ])
    items = ex_structure_map.parse_text(text, lesson_title="花花與小明")
    roles = {it["para_no"]: it["structure_role"] for it in items}
    assert roles[1] == "分說"
    assert roles[2] == "分說"
    assert roles[4] == "總說"


def test_reading_questions_parses_stem_tag_and_answer():
    text = "\n".join([
        "1.本課主角遇到什麼事？推論訊息",
        "︵測試答案一。︶",
        "2.你覺得結局如何？比較評估",
        "︵測試答案二。︶",
    ])
    items = ex_reading_questions.parse_text(text)
    assert len(items) == 2
    assert items[0]["strategy_tag"] == "推論訊息"
    assert items[0]["answer_hint"] == "測試答案一。"
    assert items[1]["strategy_tag"] == "比較評估"
