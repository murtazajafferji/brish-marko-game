from PIL import Image

src = '/Users/murt/.openclaw/workspace/brish-monko-game/sprites/monko-spritesheet.jpg'
out = '/Users/murt/.openclaw/workspace/brish-monko-game/sprites/'

img = Image.open(src)
w, h = img.size
print(f"Sheet: {w}x{h}")

cols, rows = 4, 2
fw, fh = w // cols, h // rows
print(f"Frame: {fw}x{fh}")

labels = ['idle', 'walk1', 'walk2', 'walk3', 'jump', 'fall', 'magic-windup', 'magic-cast']
frames = []

for row in range(rows):
    for col in range(cols):
        x1, y1 = col * fw, row * fh
        frame = img.crop((x1, y1, x1 + fw, y1 + fh)).convert("RGBA")
        data = frame.getdata()
        new_data = [(0,0,0,0) if r < 35 and g < 35 and b < 35 else (r,g,b,a) for r,g,b,a in data]
        frame.putdata(new_data)
        idx = row * cols + col
        name = labels[idx]
        path = f'{out}monko-{name}.png'
        frame.save(path, 'PNG')
        frames.append(path)
        print(f"  monko-{name}.png")

# Create strip
strip = Image.new('RGBA', (fw * len(frames), fh), (0, 0, 0, 0))
for i, fpath in enumerate(frames):
    strip.paste(Image.open(fpath), (i * fw, 0))
strip.save(f'{out}monko-strip.png', 'PNG')
print(f"\nStrip: {strip.size[0]}x{strip.size[1]}")
