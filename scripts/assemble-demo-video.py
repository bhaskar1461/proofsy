"""
Proofsy Investor Demo — Automated Video Assembly Pipeline
Synthesizes neural voiceover audio for each scene, renders motion title cards,
and stitches all video + audio scenes into the final high-definition MP4.
"""

import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import edge_tts

ROOT_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
RECORDINGS_DIR = SCRIPTS_DIR / "demo-recordings"
AUDIO_DIR = SCRIPTS_DIR / "demo-audio"
TEMP_DIR = SCRIPTS_DIR / "demo-temp"
OUTPUT_VIDEO = ROOT_DIR / "proofsy-investor-demo.mp4"

# Path to ffmpeg-static binary
FFMPEG_PATH = ROOT_DIR / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"

# Voice selection
VOICE = "en-US-ChristopherNeural"  # Professional, confident American male voice

SCENES = [
    {
        "scene": 1,
        "name": "Hook",
        "video_source": "slide_1",
        "raw_video": RECORDINGS_DIR / "scene-01-hook.webm",
        "audio": AUDIO_DIR / "scene-01.mp3",
        "text": "Every year, institutions issue millions of certificates — and almost none of them can be verified in under five minutes. Proofsy fixes that.",
        "slide_num": 1,
        "slide_duration": 9.0,
    },
    {
        "scene": 2,
        "name": "What It Is",
        "video_source": "recorded",
        "raw_video": RECORDINGS_DIR / "scene-02-landing-dashboard.webm",
        "audio": AUDIO_DIR / "scene-02.mp3",
        "text": "Proofsy is certificate infrastructure for institutions and event organizers — issue at scale, and every certificate is cryptographically signed and verifiable in seconds.",
    },
    {
        "scene": 3,
        "name": "Single Issuance",
        "video_source": "recorded",
        "raw_video": RECORDINGS_DIR / "scene-03-single-issuance.webm",
        "audio": AUDIO_DIR / "scene-03.mp3",
        "text": "Issuing a single certificate takes under a minute. Create an event, pick a template, fill in the recipient — it's generated, RSA-signed, and ready to send.",
    },
    {
        "scene": 4,
        "name": "Batch CSV Issuance",
        "video_source": "recorded",
        "raw_video": RECORDINGS_DIR / "scene-04-batch-issuance.webm",
        "audio": AUDIO_DIR / "scene-04.mp3",
        "text": "For a graduating class or a conference of a thousand attendees, upload a spreadsheet instead. Every certificate in the batch is generated and signed independently — one bad row never blocks the rest.",
    },
    {
        "scene": 5,
        "name": "Verification & Trust Layer",
        "video_source": "recorded",
        "raw_video": RECORDINGS_DIR / "scene-05-verification.webm",
        "audio": AUDIO_DIR / "scene-05.mp3",
        "text": "This is the part that matters. Every certificate carries an RSA-signed cryptographic signature — not a watermark, not a lookup table. Enter the code, and you're checking the signature itself. It either mathematically matches, or it doesn't. Nothing to fake, nothing to Photoshop convincingly.",
    },
    {
        "scene": 6,
        "name": "Multi-Tenant Isolation",
        "video_source": "recorded",
        "raw_video": RECORDINGS_DIR / "scene-06-multi-tenant.webm",
        "audio": AUDIO_DIR / "scene-06.mp3",
        "text": "Proofsy is multi-tenant from the ground up. Every institution's certificates, branding, and data are fully isolated — this is infrastructure for one customer or a thousand, without re-architecting.",
    },
    {
        "scene": 7,
        "name": "Dashboard & Management",
        "video_source": "recorded",
        "raw_video": RECORDINGS_DIR / "scene-07-dashboard-management.webm",
        "audio": AUDIO_DIR / "scene-07.mp3",
        "text": "Institutions get a full view of everything they've issued — searchable, revocable, and auditable. Certificate lifecycle management is built in.",
    },
    {
        "scene": 8,
        "name": "Reliability & Benchmarks",
        "video_source": "slide_8",
        "raw_video": RECORDINGS_DIR / "scene-08-reliability.webm",
        "audio": AUDIO_DIR / "scene-08.mp3",
        "text": "Every signing and verification path is tested against 1,325 automated cases, and benchmarked at 10,000-certificate scale at 670-plus certificates per second before it ships.",
        "slide_num": 8,
        "slide_duration": 12.0,
    },
    {
        "scene": 9,
        "name": "Close / CTA",
        "video_source": "recorded",
        "raw_video": RECORDINGS_DIR / "scene-09-close.webm",
        "audio": AUDIO_DIR / "scene-09.mp3",
        "text": "Proofsy — certificates institutions can issue in seconds, and anyone can trust in one scan. Book a demo at proofsy.tech.",
    },
]


async def generate_audio_tracks():
    """Synthesize high-fidelity voiceover narration for all scenes."""
    print("\n🎙️ [Phase 1/4] Synthesizing Neural Voiceovers with edge-tts...")
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    for item in SCENES:
        print(f"  🔊 Scene {item['scene']}: {item['name']}...")
        communicate = edge_tts.Communicate(item["text"], VOICE, rate="-2%")
        await communicate.save(str(item["audio"]))
        print(f"     ✓ Saved: {item['audio'].name}")


def record_motion_slides():
    """Use Playwright to capture Scene 1 and Scene 8 motion slides."""
    print("\n🖼️ [Phase 2/4] Recording Motion Graphics Slides (Scene 1 & Scene 8)...")
    slides_html = json.dumps((SCRIPTS_DIR / "title-slides.html").as_uri())
    rec_dir_json = json.dumps(RECORDINGS_DIR.as_posix())

    playwright_script = f"""
import {{ chromium }} from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function run() {{
  const browser = await chromium.launch({{ headless: false }});
  const recDir = {rec_dir_json};
  
  // Scene 1
  {{
    const tmpDir = path.join(recDir, '_tmp_s1');
    fs.mkdirSync(tmpDir, {{ recursive: true }});
    const ctx = await browser.newContext({{
      viewport: {{ width: 1920, height: 1080 }},
      recordVideo: {{ dir: tmpDir, size: {{ width: 1920, height: 1080 }} }}
    }});
    const page = await ctx.newPage();
    await page.goto({slides_html});
    await page.evaluate(() => showSlide(1));
    await new Promise(r => setTimeout(r, 9000));
    const video = page.video();
    await page.close();
    await ctx.close();
    if (video) {{
      const vPath = await video.path();
      fs.renameSync(vPath, path.join(recDir, 'scene-01-hook.webm'));
    }}
    try {{ fs.rmSync(tmpDir, {{ recursive: true, force: true }}); }} catch {{}}
  }}

  // Scene 8
  {{
    const tmpDir = path.join(recDir, '_tmp_s8');
    fs.mkdirSync(tmpDir, {{ recursive: true }});
    const ctx = await browser.newContext({{
      viewport: {{ width: 1920, height: 1080 }},
      recordVideo: {{ dir: tmpDir, size: {{ width: 1920, height: 1080 }} }}
    }});
    const page = await ctx.newPage();
    await page.goto({slides_html});
    await page.evaluate(() => showSlide(8));
    await new Promise(r => setTimeout(r, 12000));
    const video = page.video();
    await page.close();
    await ctx.close();
    if (video) {{
      const vPath = await video.path();
      fs.renameSync(vPath, path.join(recDir, 'scene-08-reliability.webm'));
    }}
    try {{ fs.rmSync(tmpDir, {{ recursive: true, force: true }}); }} catch {{}}
  }}

  await browser.close();
}}

run().catch(console.error);
"""

    temp_script = SCRIPTS_DIR / "_record_slides.mjs"
    temp_script.write_text(playwright_script, encoding="utf-8")

    try:
        subprocess.run(["node", str(temp_script)], check=True, cwd=str(ROOT_DIR))
        print("  ✓ Scene 1 (Hook) and Scene 8 (Reliability) recorded.")
    finally:
        if temp_script.exists():
            temp_script.unlink()


def get_audio_duration(audio_path: Path) -> float:
    """Get audio duration in seconds using ffprobe via ffmpeg."""
    cmd = [
        str(FFMPEG_PATH),
        "-i", str(audio_path),
    ]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    for line in res.stderr.split("\n"):
        if "Duration:" in line:
            time_str = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = time_str.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 5.0


def process_scene_clips():
    """Combine each raw video clip with its voiceover track, ensuring smooth timing."""
    print("\n🎬 [Phase 3/4] Processing & Synchronizing Individual Scene Clips...")
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    processed_clips = []

    for item in SCENES:
        scene_num = item["scene"]
        raw_video = item["raw_video"]
        audio_file = item["audio"]
        out_clip = TEMP_DIR / f"scene_{scene_num:02d}_synced.mp4"

        if not raw_video.exists():
            print(f"  ⚠️ Warning: {raw_video.name} missing, skipping...")
            continue

        audio_dur = get_audio_duration(audio_file)
        # Pad audio with 0.8s at end for breathing room
        target_dur = audio_dur + 1.0

        print(f"  🎞️ Scene {scene_num} ({item['name']}): Audio={audio_dur:.2f}s, Target={target_dur:.2f}s")

        # Use FFmpeg to:
        # 1. Loop/trim video to target duration
        # 2. Add voiceover audio track
        # 3. Scale and pad to standard 1920x1080 @ 30fps
        cmd = [
            str(FFMPEG_PATH),
            "-y",
            "-stream_loop", "-1",  # Loop video if shorter than audio
            "-i", str(raw_video),
            "-i", str(audio_file),
            "-t", f"{target_dur:.3f}",
            "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,fps=30,format=yuv420p",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(out_clip),
        ]

        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        processed_clips.append(out_clip)
        print(f"     ✓ Rendered: {out_clip.name}")

    return processed_clips


def concatenate_all(processed_clips):
    """Concatenate all scene clips into the final master video."""
    print("\n🚀 [Phase 4/4] Stitching All Scenes into Final Master Video...")
    concat_list_file = TEMP_DIR / "concat_list.txt"

    with open(concat_list_file, "w", encoding="utf-8") as f:
        for clip in processed_clips:
            # Use relative filename inside TEMP_DIR
            f.write(f"file '{clip.name}'\n")

    cmd = [
        str(FFMPEG_PATH),
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", "concat_list.txt",
        "-c", "copy",
        str(OUTPUT_VIDEO),
    ]

    res = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=str(TEMP_DIR))
    print(f"\n✨ SUCCESS! Master Investor Demo Video Created:\n   {OUTPUT_VIDEO}")
    file_size_mb = OUTPUT_VIDEO.stat().st_size / (1024 * 1024)
    print(f"   Size: {file_size_mb:.2f} MB")


async def main():
    print("╔══════════════════════════════════════════════════════════════════════════════╗")
    print("║          Proofsy Investor Demo — Master Video Assembly Pipeline             ║")
    print("╚══════════════════════════════════════════════════════════════════════════════╝")

    if not FFMPEG_PATH.exists():
        print(f"❌ Error: ffmpeg binary not found at {FFMPEG_PATH}")
        sys.exit(1)

    await generate_audio_tracks()
    record_motion_slides()
    clips = process_scene_clips()
    concatenate_all(clips)


if __name__ == "__main__":
    asyncio.run(main())
