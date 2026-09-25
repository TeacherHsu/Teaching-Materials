"""出版社別的來源對應設定：不同出版社大補帖的目標語詞／解釋位置不同（翰林在
05形音輕鬆學的「■語詞解釋」，康軒位置尚未盤點），merge 階段依 profile 決定
words[] 主來源，避免把出版社差異寫死在 merge.py 裡。
"""
from __future__ import annotations

PROFILES = {
    "翰林": {
        "words_primary_source": "vocab_explanations",  # 05形音輕鬆學．■語詞解釋
        "words_fallback_source": "word_meanings",  # 06字義分析（05 缺檔/轉檔失敗時的備援）
        "polysemy_authority_source": "vocab_explanations",  # ■字義辨正 為一字多義權威字義來源
    },
    "康軒": {
        "words_primary_source": None,
        "words_fallback_source": "word_meanings",
        "polysemy_authority_source": None,
        "note": "康軒版大補帖「目標語詞與解釋」的實際段落位置尚未盤點確認，"
                "待確認位置後補上 words_primary_source（本欄暫留空，不得憑猜測填值）。",
    },
}

DEFAULT_PROFILE = {
    "words_primary_source": None,
    "words_fallback_source": "word_meanings",
    "polysemy_authority_source": None,
    "note": "未知出版社，尚無 profile，僅能用 06字義分析 造詞作為 words 備援來源。",
}


def get_profile(publisher: str) -> dict:
    return PROFILES.get(publisher, DEFAULT_PROFILE)
