#!/usr/bin/env python3
"""把大項插圖統一成「該大項的主題色」（CF 2026-10-04：圖示配色和整個畫面不協調）。

原圖（彩色、黑描邊）放在 ~/mandarin-work/_vendor/icons-original/。
做法：依亮度把每個像素對應到主題色的色階——
  深色描邊 → 主題色的淺調（不用黑線）；中間調 → 主題色；亮部 → 主題淡色 → 近白。
主題色和 src/styles/tokens.css 的 --module-* 一致；大項對應見 moduleRegistry.js。
    python3 tools/recolor_icons.py
"""
import os
from PIL import Image

SRC = os.path.expanduser('~/mandarin-work/_vendor/icons-original')
OUT = 'public/assets/icons'
PALETTE = {  # base, tint（同 tokens.css）
    'blue': ((0x3a, 0x7c, 0xc0), (0xdf, 0xeb, 0xf8)),
    'teal': ((0x1d, 0x8c, 0x72), (0xda, 0xf0, 0xe9)),
    'purple': ((0x82, 0x68, 0xc8), (0xea, 0xe3, 0xf8)),
    'terracotta': ((0xcc, 0x6a, 0x2c), (0xfa, 0xe4, 0xd2)),
    'rose': ((0xd1, 0x4a, 0x72), (0xfa, 0xde, 0xe6)),
    'olive': ((0x64, 0x89, 0x2c), (0xe9, 0xf2, 0xd8)),
}
ICON_COLOR = {  # 圖檔 → 主題色（moduleRegistry 的 color）
    'characters': 'blue', 'vocabulary': 'teal', 'idiom_builder': 'purple', 'sentence_practice': 'terracotta',
    'reading': 'rose', 'main_idea': 'blue', 'zhuyin_typing': 'terracotta', 'polysemy': 'olive',
    'polyphones': 'blue', 'lookalikes': 'teal', 'listening': 'teal', 'rhetoric': 'purple',
    'review': 'terracotta', 'visual_search': 'olive', 'word_reading': 'rose',
}


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def ramp(l, base, tint):
    """亮度 0..1 → 顏色。描邊（很暗）不給黑，改成主題色淡一點。"""
    white = (255, 255, 255)
    soft_base = lerp(base, white, 0.18)
    if l < 0.30:
        return lerp(base, white, 0.38)          # 描邊
    if l < 0.62:
        return lerp(soft_base, tint, (l - 0.30) / 0.32)
    return lerp(tint, lerp(tint, white, 0.6), (l - 0.62) / 0.38)


for name, color in ICON_COLOR.items():
    src = os.path.join(SRC, f'{name}.webp')
    if not os.path.exists(src):
        print('缺原圖', name); continue
    base, tint = PALETTE[color]
    img = Image.open(src).convert('RGBA')
    px = [(*ramp((0.299 * r + 0.587 * g + 0.114 * b) / 255, base, tint), a) if a else (r, g, b, a)
          for r, g, b, a in img.getdata()]
    img.putdata(px)
    img.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=90, method=6)
print('done')
