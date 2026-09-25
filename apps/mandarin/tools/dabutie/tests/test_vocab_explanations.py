"""05形音輕鬆學（vocab_explanations）單元測試：全部用合成 fixture（虛構課文），
不含大補帖原文。涵蓋語詞解釋／字義辨正／認識多音字／字形辨別四段的解析邏輯。"""
from extractors.vocab_explanations import (
    _parse_polyphones,
    _parse_polysemy_groups,
    _parse_words,
    _resolve_polysemy_chars,
    _split_sections,
    parse_lookalike_grid,
)


def test_split_sections_by_header():
    paragraphs = ["第一課　虛構課", "■字義辨正", "①一", "②二", "■語詞解釋", "1.\t花朵：花。", "\t花園裡開滿了花朵。"]
    sections = _split_sections(paragraphs)
    assert list(sections.keys()) == ["字義辨正", "語詞解釋"]
    assert sections["字義辨正"] == ["①一", "②二"]
    assert sections["語詞解釋"] == ["1.\t花朵：花。", "\t花園裡開滿了花朵。"]


def test_parse_words_entry_plus_example_line():
    lines = [
        "1.\t等待：等候。",
        "\t天未亮，許多遊客便已爬上山頂等待觀看日出。",
        "2.\t蝸牛：動物名，軟體動物。",
        "\t蝸牛走過的地方，會留下一道白色透明的黏液。",
    ]
    words = _parse_words(lines)
    assert len(words) == 2
    assert words[0] == {
        "no": 1, "word": "等待", "meaning": "等候",
        "example_sentence": "天未亮，許多遊客便已爬上山頂等待觀看日出。",
    }
    assert words[1]["word"] == "蝸牛"
    assert words[1]["example_sentence"].startswith("蝸牛走過")


def test_parse_words_ignores_lines_before_first_entry():
    lines = ["", "雜訊行", "1.\t花：植物。", "\t花開了。"]
    words = _parse_words(lines)
    assert len(words) == 1
    assert words[0]["word"] == "花"


def test_parse_polysemy_groups_boundary_on_repeated_mark_one():
    lines = ["①\t食物未經咀嚼就吃下去。如：狼吞虎嚥。", "②\t忍住。如：忍氣吞聲。",
              "①\t長的相反詞。如：短跑。", "②\t過失、缺點。如：短處。"]
    groups = _parse_polysemy_groups(lines)
    assert len(groups) == 2
    assert [s["definition"] for s in groups[0]["senses"]] == ["食物未經咀嚼就吃下去", "忍住"]
    assert [s["definition"] for s in groups[1]["senses"]] == ["長的相反詞", "過失、缺點"]
    assert groups[0]["senses"][0]["examples"] == ["狼吞虎嚥"]


def test_resolve_polysemy_chars_excludes_polyphone_chars():
    groups = [{"senses": []}, {"senses": []}]
    floaters = {1: ["吞", "待"], 2: ["短", "彈"]}
    resolved = _resolve_polysemy_chars(groups, floaters, exclude_chars={"待", "彈"})
    assert resolved == ["吞", "短"]


def test_resolve_polysemy_chars_ambiguous_returns_none():
    groups = [{"senses": []}]
    floaters = {1: ["甲", "乙"]}  # 兩個候選都不在排除集合，無法唯一判定
    resolved = _resolve_polysemy_chars(groups, floaters, exclude_chars=set())
    assert resolved == [None]


def test_parse_polyphones_multiple_readings_same_char():
    lines = [
        "待｜\t①\t等候。如：等待。",
        "②\t對待、照顧。如：優待。",
        "",
        "待｜\t逗留、停留。\n如：我今天都待在家裡，沒出門。",
    ]
    readings = _parse_polyphones(lines)
    assert list(readings.keys()) == ["待"]
    assert len(readings["待"]) == 2  # 兩個讀音（區塊）
    assert len(readings["待"][0]["senses"]) == 2  # 第一個讀音有兩個義項
    assert readings["待"][1]["senses"][0]["definition"] == "逗留、停留"
    assert readings["待"][1]["senses"][0]["examples"] == ["我今天都待在家裡", "沒出門"]


def test_parse_lookalike_grid_splits_groups_by_empty_separator_cells():
    num_row = ["2.", "", "1."]
    char_row = ["她", "他", "", "侍", "待"]
    def_row = ["：她的眼睛", "：他鄉", "", "：侍者、侍衛", "：待客、待命"]
    todos = []
    groups = parse_lookalike_grid(num_row, char_row, def_row, todos)
    assert not todos
    assert len(groups) == 2
    assert groups[0]["label"] == "2"
    assert groups[0]["chars"] == [
        {"char": "她", "example": "她的眼睛"},
        {"char": "他", "example": "他鄉"},
    ]
    assert groups[1]["chars"] == [
        {"char": "侍", "example": "侍者、侍衛"},
        {"char": "待", "example": "待客、待命"},
    ]


def test_parse_lookalike_grid_mismatched_columns_reports_todo_not_crash():
    todos = []
    groups = parse_lookalike_grid(["1."], ["水", "永"], ["：水準"], todos)
    assert groups == []
    assert todos and "略過" in todos[0]
