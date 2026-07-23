from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
pages = sorted((root / "qa_pages").glob("page_*.png"))
out = root / "qa_sheets"
out.mkdir(exist_ok=True)

cell_w, cell_h = 1240, 1754
gap = 20
for sheet_index in range(0, len(pages), 4):
    group = pages[sheet_index:sheet_index + 4]
    canvas = Image.new("RGB", (cell_w * 2 + gap * 3, cell_h * 2 + gap * 3), "white")
    draw = ImageDraw.Draw(canvas)
    for slot, page_path in enumerate(group):
        image = Image.open(page_path).convert("RGB")
        image.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
        x = gap + (slot % 2) * (cell_w + gap)
        y = gap + (slot // 2) * (cell_h + gap)
        canvas.paste(image, (x, y))
        draw.rectangle((x, y, x + image.width - 1, y + image.height - 1), outline="#9AA8BD", width=2)
    canvas.save(out / f"sheet_{sheet_index // 4 + 1:02d}.png")

print(f"{len(pages)} pages -> {(len(pages) + 3) // 4} sheets")
