from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "battle-unified"
CANVAS_SIZE = (512, 768)
TARGET_HEIGHT = 700
BOTTOM_PAD = 26

SOURCES = [
    (
        r"C:\Users\cheng\AppData\Local\Temp\codex-clipboard-c79a902c-5ae9-479d-a350-447b93b6e483.png",
        "1Ayase-Eli-unified.png",
    ),
    (
        r"C:\Users\cheng\AppData\Local\Temp\codex-clipboard-6cc38f9f-a0ff-4301-8a99-9dcd0cd973e9.png",
        "15Toujou-Nozomi-unified.png",
    ),
    (
        r"C:\Users\cheng\AppData\Local\Temp\codex-clipboard-47f857c2-70e1-408d-8bae-6a3496801763.png",
        "18Yazawa-Nico-unified.png",
    ),
    (
        r"C:\Users\cheng\AppData\Local\Temp\codex-clipboard-31f33cb2-a571-448f-bf90-6f012282d813.png",
        "9Minami-Kotori-unified.png",
    ),
    (
        r"C:\Users\cheng\AppData\Local\Temp\codex-clipboard-3becde61-6914-41c5-8fb2-d8da965bc486.png",
        "10Nishikino-Maki-unified.png",
    ),
    (
        r"C:\Users\cheng\AppData\Local\Temp\codex-clipboard-e3190902-3578-40a7-a9ae-e878d681d7e5.png",
        "120Arashi-Chisato-unified.png",
    ),
]


def border_background(rgb):
    border = np.concatenate([rgb[0, :, :], rgb[-1, :, :], rgb[:, 0, :], rgb[:, -1, :]], axis=0)
    return np.median(border, axis=0)


def connected_background_mask(rgb, tolerance=18):
    height, width, _ = rgb.shape
    bg = border_background(rgb)
    distance = np.linalg.norm(rgb.astype(np.float32) - bg.astype(np.float32), axis=2)
    candidate = distance <= tolerance
    seen = np.zeros((height, width), dtype=bool)
    queue = deque()

    for x in range(width):
        if candidate[0, x]:
            queue.append((0, x))
        if candidate[height - 1, x]:
            queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0]:
            queue.append((y, 0))
        if candidate[y, width - 1]:
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if seen[y, x] or not candidate[y, x]:
            continue
        seen[y, x] = True
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and not seen[ny, nx] and candidate[ny, nx]:
                queue.append((ny, nx))

    return seen


def soften_alpha(alpha):
    image = Image.fromarray(alpha, "L")
    # Down/up sampling softens jagged matte edges without changing the subject shape much.
    small = image.resize((max(1, image.width // 2), max(1, image.height // 2)), Image.Resampling.BOX)
    return small.resize(image.size, Image.Resampling.BILINEAR)


def cutout(src_path):
    image = Image.open(src_path).convert("RGBA")
    arr = np.array(image)
    mask = connected_background_mask(arr[:, :, :3])
    alpha = np.where(mask, 0, 255).astype(np.uint8)
    alpha = np.maximum(np.array(soften_alpha(alpha)), alpha)
    arr[:, :, 3] = alpha
    subject = Image.fromarray(arr, "RGBA")
    bbox = subject.getbbox()
    if not bbox:
        raise ValueError(f"No subject found in {src_path}")
    return subject.crop(bbox)


def place_on_canvas(subject):
    canvas_w, canvas_h = CANVAS_SIZE
    scale = TARGET_HEIGHT / subject.height
    new_size = (round(subject.width * scale), TARGET_HEIGHT)
    if new_size[0] > canvas_w - 28:
        scale = (canvas_w - 28) / subject.width
        new_size = (round(subject.width * scale), round(subject.height * scale))

    resized = subject.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    x = (canvas_w - resized.width) // 2
    y = canvas_h - BOTTOM_PAD - resized.height
    canvas.alpha_composite(resized, (x, y))
    return canvas


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src, name in SOURCES:
        final = place_on_canvas(cutout(Path(src)))
        out_path = OUT_DIR / name
        final.save(out_path)
        print(out_path.relative_to(ROOT))


if __name__ == "__main__":
    main()
