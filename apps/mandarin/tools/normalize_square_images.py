#!/usr/bin/env python3
"""把教材圖片統一成 960×960 正方形 WebP、單張 ≤300 KiB（AGENTS.md「產圖規格」，CF 2026-10-06）。
不重畫內容（避免失去原圖的教學功能）：
  - 正方形：只縮放到 960。
  - 非正方形：四周補邊成正方形（補邊色＝原圖四角的顏色，看起來像同一張圖），原圖完整保留、不裁切，再縮放。
檔名不變（資料不用改路徑）；成語資料有 image_layout 的，依處理方式標 square-native／square-contain。
用法：python3 tools/normalize_square_images.py [--dry-run]
"""
import glob, io, json, os, statistics, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE, LIMIT = 960, 300 * 1024
SKIP = ('/phrases/', '/icons/')

def corner_color(im):
    w, h = im.size
    pts = [im.getpixel((x, y)) for x, y in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]]
    return tuple(int(statistics.median(p[i] for p in pts)) for i in range(3))

def encode(im):
    for q in (86, 80, 74, 68, 60, 52):
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q, method=6)
        if buf.tell() <= LIMIT:
            return buf.getvalue(), q
    return None, None

def main(dry):
    changed = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'public/assets/**/*.webp'), recursive=True)):
        if any(s in f for s in SKIP):
            continue
        im = Image.open(f); w, h = im.size
        if (w, h) == (SIZE, SIZE) and os.path.getsize(f) <= LIMIT:
            continue
        im = im.convert('RGB')
        layout = 'square-native'
        if w != h:
            s = max(w, h); bg = Image.new('RGB', (s, s), corner_color(im))
            bg.paste(im, ((s - w) // 2, (s - h) // 2)); im = bg; layout = 'square-contain'
        im = im.resize((SIZE, SIZE), Image.LANCZOS)
        data, q = encode(im)
        rel = os.path.relpath(f, os.path.join(ROOT, 'public'))
        if data is None:
            print('FAIL 壓不到 300 KiB', rel); continue
        print(f'{"(dry) " if dry else ""}{rel}: {w}×{h} → 960×960 {layout} q{q} {len(data)//1024} KiB')
        if not dry:
            open(f, 'wb').write(data)
        changed['/' + rel] = layout
    # 成語資料有 image_layout 欄位的，同步標記
    if not dry:
        for p in glob.glob(os.path.join(ROOT, 'public/data/115AG*/lesson*.json')):
            d = json.load(open(p)); dirty = False
            for idm in d.get('idioms', []):
                img = idm.get('image')
                if not img or 'image_layout' not in idm:
                    continue
                key = next((k for k in changed if k.endswith(img.lstrip('./'))), None)
                if key and idm['image_layout'] != changed[key]:
                    idm['image_layout'] = changed[key]; dirty = True
            if dirty:
                open(p, 'w').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
    print(f'共 {len(changed)} 張')

if __name__ == '__main__':
    main('--dry-run' in sys.argv)
