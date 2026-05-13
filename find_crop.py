from PIL import Image
import numpy as np

img = Image.open("src/assets/rocks_v2.png").convert("RGBA")
pixels = np.array(img)

# Get Alpha channel
alpha = pixels[:, :, 3]
height, width = alpha.shape

# Calculate number of non-transparent pixels for each row
row_widths = np.sum(alpha > 10, axis=1)

# Scan range where the gap between 4th (EXAM) and 5th (blank) rock is likely to be
# From roughly 60% down to 85% down the image
min_scan = int(height * 0.60)
max_scan = int(height * 0.85)

best_row = min_scan
min_width = width

for y in range(min_scan, max_scan):
    w = row_widths[y]
    if w < min_width and w > 10: # w>10 avoids empty rows
        min_width = w
        best_row = y

print(f"Found optimal crop line at row Y={best_row} ({(best_row/height)*100:.1f}% of height) with width {min_width}px.")

# Crop image and save it
cropped = img.crop((0, 0, width, best_row))
cropped.save("src/assets/rocks_v3.png")
print("Successfully cropped and saved to src/assets/rocks_v3.png")
