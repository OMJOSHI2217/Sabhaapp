from PIL import Image

img = Image.open("src/assets/rocks_v2.png").convert("RGBA")
width, height = img.size

# Using the mathematically computed perfect bottleneck Y=840
crop_y = 840

# Crop image and save
cropped = img.crop((0, 0, width, crop_y))
cropped.save("src/assets/rocks_v3.png")
print(f"Successfully cropped bottom stone at Y={crop_y}. Saved to src/assets/rocks_v3.png")
