#!/usr/bin/env python3
"""Cut short, isolated bang clips out of the CC0 / public-domain field recordings
in sound-src/ and write them to public/sounds/ as mono MP3.

Usage: python3 scripts/cut-sounds.py   (needs ffmpeg on PATH)
"""
import array
import math
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "sound-src")
OUT = os.path.join(ROOT, "public", "sounds")
SR = 22050
WIN = 220  # 10 ms


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        check=True, capture_output=True,
    ).stdout
    a = array.array("h")
    a.frombytes(raw)
    return a


def rms_windows(samples):
    out = []
    for i in range(0, len(samples) - WIN, WIN):
        s = 0
        for v in samples[i:i + WIN]:
            s += v * v
        out.append(math.sqrt(s / WIN))
    return out


def find_bangs(env):
    """Onsets where energy jumps hard over the preceding 150 ms and decays after."""
    hits = []
    for i in range(15, len(env) - 60):
        before = sum(env[i - 15:i - 1]) / 14 + 1
        peak = max(env[i:i + 3])
        if peak < 2500:
            continue
        jump = peak / before
        if jump < 6:
            continue
        if env[i - 1] * 3 > peak:
            continue
        tail = sum(env[i + 40:i + 60]) / 20
        decay = peak / (tail + 1)
        hits.append((jump * min(decay, 20), i, peak))
    hits.sort(reverse=True)
    picked = []
    for score, i, peak in hits:
        if all(abs(i - j) > 80 for _, j, _ in picked):
            picked.append((score, i, peak))
    return picked


def max_volume_db(src, start_s, dur_s):
    err = subprocess.run([
        "ffmpeg", "-v", "info", "-ss", f"{start_s:.3f}", "-t", f"{dur_s:.3f}", "-i", src,
        "-ac", "1", "-af", "volumedetect", "-f", "null", "-",
    ], capture_output=True, text=True).stderr
    for line in err.splitlines():
        if "max_volume" in line:
            return float(line.split("max_volume:")[1].split("dB")[0])
    return 0.0


def cut(src, start_s, dur_s, dest, fade_s):
    gain = -1.0 - max_volume_db(src, start_s, dur_s)
    fade_start = max(dur_s - fade_s, 0.02)
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-ss", f"{start_s:.3f}", "-t", f"{dur_s:.3f}", "-i", src,
        "-ac", "1", "-ar", "44100",
        "-af", f"highpass=f=35,volume={gain:.2f}dB,afade=t=in:d=0.003,"
               f"afade=t=out:st={fade_start:.3f}:d={fade_s:.3f}:curve=exp",
        "-codec:a", "libmp3lame", "-b:a", "96k", dest,
    ], check=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    bang_sources = [
        "Firecracker_sounds_2022-12-31T23-13-02.ogg",
        "Firecracker_sounds_2022-12-31T23-25-40.ogg",
        "Fire_crackers_-_New_Year_2023_-_2022-12-31T23-53-56.ogg",
        "Silvester_fireworks_from_the_street_01.ogg",
    ]
    candidates = []
    for name in bang_sources:
        path = os.path.join(SRC, name)
        env = rms_windows(decode(path))
        for score, i, peak in find_bangs(env)[:8]:
            candidates.append((score, name, i * WIN / SR, peak))
        print(f"{name}: analysed", file=sys.stderr)
    candidates.sort(reverse=True)

    # Loudest peaks become big bombs, the rest small bangs.
    top = candidates[:10]
    top.sort(key=lambda c: -c[3])
    for n, (score, name, t, peak) in enumerate(top[:4]):
        cut(os.path.join(SRC, name), t - 0.01, 1.1, os.path.join(OUT, f"boom-{n + 1}.mp3"), 0.8)
        print(f"boom-{n + 1}: {name} @ {t:.2f}s peak={peak:.0f}", file=sys.stderr)
    for n, (score, name, t, peak) in enumerate(top[4:10]):
        cut(os.path.join(SRC, name), t - 0.01, 0.45, os.path.join(OUT, f"bang-{n + 1}.mp3"), 0.35)
        print(f"bang-{n + 1}: {name} @ {t:.2f}s peak={peak:.0f}", file=sys.stderr)

    # Aerial bursts with crackle tails from the fireworks recordings.
    for n, name in enumerate(["Fireworks_piece.ogg", "Silvester_fireworks_from_the_street_02_cool_stuff.ogg"]):
        path = os.path.join(SRC, name)
        env = rms_windows(decode(path))
        best = find_bangs(env)[:2]
        for k, (score, i, peak) in enumerate(best):
            t = i * WIN / SR
            cut(path, t - 0.01, 1.4, os.path.join(OUT, f"sky-{n * 2 + k + 1}.mp3"), 1.0)
            print(f"sky-{n * 2 + k + 1}: {name} @ {t:.2f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
