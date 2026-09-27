from PIL import Image, ImageDraw, ImageFont

img_path = "assets/new-partner-logo.png"
# Re-load original image from git to undo the cut-off change
import subprocess
subprocess.run(["git", "checkout", "assets/new-partner-logo.png"])

img = Image.open(img_path).convert("RGBA")
width, height = img.size

# We need to expand the image width to fit the new text.
font_path = "/System/Library/Fonts/Supplemental/Impact.ttf"
font = ImageFont.truetype(font_path, 46) # Match size better
text_to_add = " & Polytechnique"

# Create a new image that is wider
new_width = width + 350
new_img = Image.new("RGBA", (new_width, height), (255, 255, 255, 255))
new_img.paste(img, (0, 0))

draw = ImageDraw.Draw(new_img)
text_color = (3, 54, 117, 255)

# The (A) text is on the second line. 
# y_mid = 187 + (400-187)/2 = 293
# Let's place it at x=750, y=260
draw.text((750, 275), text_to_add, font=font, fill=text_color)

# Save
new_img.save("assets/new-partner-logo.png")
print("Saved expanded image")
