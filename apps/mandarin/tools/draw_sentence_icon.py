#!/usr/bin/env python3
"""重繪「練習句子」大項圖示（CF 2026-10-04：原圖只有幾條細橫條，淡化後幾乎看不見）。
畫面：一張句子卡，上面三個詞塊排成一句，下面一支鉛筆——「把詞排成句子、寫下來」。
風格對齊 soften_icons.py 處理後的其他圖示：淡雅填色、主色淺調描邊、無黑線。
"""
from PIL import Image, ImageDraw

S = 1024
TERRA = (201, 110, 74)
def mix(c, t): return tuple(round(v + (255 - v) * t) for v in c)
LINE = (40, 40, 40)  # 原稿用深線，交給 recolor_icons.py 統一成主題色
img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
W = 26
# 句子卡
d.rounded_rectangle((90, 210, 934, 700), radius=70, fill=(248,248,248), outline=LINE, width=W)
# 三個詞塊
chips = [((150, 330, 400, 470), (150,150,150)), ((430, 330, 640, 470), (185,185,185)), ((670, 330, 874, 470), (215,215,215))]
for box, col in chips:
    d.rounded_rectangle(box, radius=40, fill=col, outline=LINE, width=W - 6)
# 底線（寫字的格線）
d.rounded_rectangle((170, 560, 760, 590), radius=15, fill=(120,120,120))
# 鉛筆（斜放在右下）
pencil = Image.new('RGBA', (S, S), (0, 0, 0, 0))
p = ImageDraw.Draw(pencil)
p.rounded_rectangle((420, 470, 900, 570), radius=30, fill=(200,200,200), outline=LINE, width=W - 6)
p.rectangle((800, 470, 860, 570), fill=(140,140,140))
p.polygon([(420, 470), (300, 520), (420, 570)], fill=(235,235,235), outline=LINE)
p.polygon([(340, 503), (300, 520), (340, 537)], fill=(90,90,90))
pencil = pencil.rotate(28, center=(600, 520), resample=Image.BICUBIC)
img.alpha_composite(pencil, (90, 230))
img = img.resize((256, 256), Image.LANCZOS)
import os
img.save(os.path.expanduser('~/mandarin-work/_vendor/icons-original/sentence_practice.webp'), 'WEBP', quality=95)
img.save('/private/tmp/claude-501/-Users-hsuchiafang-sped-os/ed0b7526-392f-4e5b-9d25-d87c46b06f6e/scratchpad/sentence_icon.png')
