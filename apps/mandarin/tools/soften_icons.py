#!/usr/bin/env python3
"""把大項插圖變淡雅：深色描邊改成主色的淺色調、整體往白色混一點。

CF 2026-10-04：「各關圖示縮小一點，去掉黑色線條，顏色淡雅一點，降低視覺干擾」。
原圖留在 git 歷史（public/assets/icons/*.webp 在 1e5f2ee 以前的版本）。

    python3 tools/soften_icons.py            # 處理 public/assets/icons/*.webp（原地覆寫）
"""
import colorsys
import glob
from collections import Counter
from PIL import Image

LINE_LUMA = 95      # 低於這個亮度視為描邊
LINE_MIX = 0.55     # 描邊改成「主色往白混 55%」
FILL_MIX = 0.22     # 其他顏色往白混 22%，降低飽和感


def luma(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b


def mix_white(c, t):
    return tuple(round(v + (255 - v) * t) for v in c)


def dominant(img):
    """不透明、非描邊、有彩度的像素裡最多的顏色（量化後）。"""
    cnt = Counter()
    for r, g, b, a in img.getdata():
        if a < 200 or luma(r, g, b) < LINE_LUMA:
            continue
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s < 0.25 or l > 0.9:
            continue
        cnt[(r // 24 * 24, g // 24 * 24, b // 24 * 24)] += 1
    return cnt.most_common(1)[0][0] if cnt else (150, 150, 150)


for path in sorted(glob.glob('public/assets/icons/*.webp')):
    img = Image.open(path).convert('RGBA')
    main = dominant(img)
    line = mix_white(main, LINE_MIX)
    out = []
    for r, g, b, a in img.getdata():
        if a == 0:
            out.append((r, g, b, a))
            continue
        if luma(r, g, b) < LINE_LUMA:
            out.append((*line, a))
        else:
            out.append((*mix_white((r, g, b), FILL_MIX), a))
    img.putdata(out)
    img.save(path, 'WEBP', quality=90, method=6)
    print(path, 'main', main)
