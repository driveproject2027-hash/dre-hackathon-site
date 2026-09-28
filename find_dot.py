from PIL import Image

img_path = "/Users/nischalmittal/.gemini/antigravity-ide/brain/121f0e4b-1d99-43f4-b9c1-eba0d72ab43c/.user_uploaded/media_1790479354981.png"
img = Image.open(img_path).convert("RGB")
width, height = img.size

# Find the blue dot by looking for pixels where Blue > Red + 50 and Blue > Green + 20
blue_pixels = []
for y in range(height):
    for x in range(width):
        r, g, b = img.getpixel((x, y))
        if b > r + 50 and b > g + 20 and b > 150:
            # exclude the dark blue text (which has low RGB values overall)
            if r + g + b > 300: 
                blue_pixels.append((x, y))

if blue_pixels:
    avg_x = sum(x for x, y in blue_pixels) / len(blue_pixels)
    avg_y = sum(y for x, y in blue_pixels) / len(blue_pixels)
    print(f"Dot found at approximately: X={int(avg_x)}, Y={int(avg_y)}")
else:
    print("No blue dot found!")
