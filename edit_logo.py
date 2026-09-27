from PIL import Image, ImageDraw, ImageFont

img_path = "assets/new-partner-logo.png"
img = Image.open(img_path).convert("RGBA")
width, height = img.size

# Find text color
text_pixels = []
for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        if r < 100 and g < 100 and b < 150 and a > 200:
            text_pixels.append((x, y, r, g, b))

if text_pixels:
    # Just take an average or use one of the dark pixels
    r = sum(p[2] for p in text_pixels) // len(text_pixels)
    g = sum(p[3] for p in text_pixels) // len(text_pixels)
    b = sum(p[4] for p in text_pixels) // len(text_pixels)
    text_color = (r, g, b, 255)
    print(f"Detected text color: {text_color}")
else:
    text_color = (0, 51, 102, 255)
    print("Using default text color")

# Bounding box of the dark pixels to find where to put the text
max_x = max(p[0] for p in text_pixels)
min_y = min(p[1] for p in text_pixels)
max_y = max(p[1] for p in text_pixels)
print(f"Max X of text: {max_x}, Y range: {min_y} - {max_y}")

# Draw text
draw = ImageDraw.Draw(img)
font_path = "/System/Library/Fonts/Supplemental/Impact.ttf"
try:
    font = ImageFont.truetype(font_path, 42)
except Exception as e:
    print(f"Font error: {e}")
    font = ImageFont.load_default()

# Place it to the right of max_x. 
# We'll use max_x + 10 for X, and for Y we will use the middle of the text range?
# Wait, "(A)" is on the second line. "Visakhapatnam" is on the third line.
# Let's find the max X for pixels that are roughly in the middle Y range.
y_mid = min_y + (max_y - min_y) // 2
mid_pixels = [p for p in text_pixels if y_mid - 20 < p[1] < y_mid + 20]
if mid_pixels:
    mid_max_x = max(p[0] for p in mid_pixels)
    print(f"Max X in mid range: {mid_max_x}")
else:
    mid_max_x = max_x

draw.text((mid_max_x + 15, y_mid - 30), "& Polytechnique", font=font, fill=text_color)
img.save("assets/new-partner-logo.png")
print("Saved assets/new-partner-logo.png")
