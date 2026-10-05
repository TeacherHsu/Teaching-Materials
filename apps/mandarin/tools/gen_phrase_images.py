#!/usr/bin/env python3
"""照樣造短語的圖片：讀各課 phrase_builders[].rounds[].image（src＋prompt），
缺檔的用 Codex OAuth（codex-ppt 的 image_gen.py）生圖，轉成 512px WebP 放 public/assets/phrases/。
風格統一在這裡加，資料裡的 prompt 只寫主體。已存在的圖不重畫（要重畫先刪檔）。
用法：python3 tools/gen_phrase_images.py [--only 115AG2H09] [--jobs 3] [--dry-run]
"""
import argparse, glob, json, os, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN = os.path.expanduser('~/.claude/skills/codex-ppt/scripts/image_gen.py')
STYLE = ('Simple educational illustration for an elementary school Chinese vocabulary card. '
         'Subject: {subject}. Pure white background, soft low-saturation colors, clean flat style with light outlines, '
         'one clear subject centered, no background clutter, no text, no letters, no numbers, '
         'calm and respectful, not cartoonish or childish.')

def jobs(only):
    for p in sorted(glob.glob(os.path.join(ROOT, 'public/data/115AG*/lesson*.json'))):
        d = json.load(open(p))
        if only and not d['lesson_id'].startswith(only):
            continue
        for pb in d.get('phrase_builders', []):
            for r in pb.get('rounds', []):
                img = r.get('image') or {}
                if img.get('src') and img.get('prompt'):
                    out = os.path.join(ROOT, 'public', img['src'].lstrip('/'))
                    if not os.path.exists(out):
                        yield out, img['prompt']

def run(job):
    out, subject = job
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, 'x.png')
        r = subprocess.run([sys.executable, GEN, 'generate', '--backend', 'codex-oauth', '--size', '1024x1024',
                            '--quality', 'low', '--prompt', STYLE.format(subject=subject), '--out', png],
                           capture_output=True, text=True)
        if r.returncode or not os.path.exists(png):
            return f'FAIL {out}: {r.stderr.strip()[-200:]}'
        os.makedirs(os.path.dirname(out), exist_ok=True)
        r = subprocess.run(['cwebp', '-quiet', '-q', '78', '-resize', '512', '512', png, '-o', out], capture_output=True, text=True)
        return f'OK {os.path.relpath(out, ROOT)}' if not r.returncode else f'FAIL webp {out}'

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--only'); ap.add_argument('--jobs', type=int, default=3); ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    todo = list(jobs(a.only))
    print(f'{len(todo)} 張要畫')
    if a.dry_run:
        for o, s in todo: print(o, '|', s)
        sys.exit(0)
    with ThreadPoolExecutor(a.jobs) as ex:
        for msg in ex.map(run, todo): print(msg, flush=True)
