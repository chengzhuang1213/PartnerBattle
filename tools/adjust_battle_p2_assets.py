from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "assets" / "battle-p2"
OUT_DIR = ROOT / "assets" / "battle-p2-adjusted"

# Keep Kotori as the visual reference. Add transparent canvas around the two
# close-cropped assets so the same CSS display height renders them smaller.
ADJUSTMENTS = {
    "10Nishikino-Maki-UFQB4E.png": {
        "out": "10Nishikino-Maki-adjusted.png",
        "scale": 0.82,
        "canvas": (525, 1176),
        "bottom": 0,
    },
    "120Arashi-Chisato-eySO7L.png": {
        "out": "120Arashi-Chisato-adjusted.png",
        "scale": 0.86,
        "canvas": (525, 1176),
        "bottom": 0,
    },
}


def make_adjusted(name, spec):
    source = Image.open(SRC_DIR / name).convert("RGBA")
    new_size = (round(source.width * spec["scale"]), round(source.height * spec["scale"]))
    resized = source.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", spec["canvas"], (0, 0, 0, 0))
    x = (canvas.width - resized.width) // 2
    y = canvas.height - spec["bottom"] - resized.height
    canvas.alpha_composite(resized, (x, y))
    out = OUT_DIR / spec["out"]
    canvas.save(out)
    return out


def make_preview(outputs):
    files = [
        SRC_DIR / "9Minami-Kotori-BkWR39.png",
        *outputs,
    ]
    thumb_w, thumb_h = 220, 360
    sheet = Image.new("RGBA", (thumb_w * len(files), thumb_h), (240, 240, 240, 255))
    for index, path in enumerate(files):
        image = Image.open(path).convert("RGBA")
        image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        x = index * thumb_w + (thumb_w - image.width) // 2
        y = thumb_h - image.height
        sheet.alpha_composite(image, (x, y))
    preview = OUT_DIR / "preview.png"
    sheet.save(preview)
    return preview


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    outputs = [make_adjusted(name, spec) for name, spec in ADJUSTMENTS.items()]
    for path in outputs:
        print(path.relative_to(ROOT))
    print(make_preview(outputs).relative_to(ROOT))


if __name__ == "__main__":
    main()
