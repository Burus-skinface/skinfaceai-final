from PIL import Image, ImageDraw, ImageFont
import urllib.request
urllib.request.urlretrieve('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80', 'img.jpg')
img = Image.open('img.jpg')
draw = ImageDraw.Draw(img)
w, h = img.size
# Draw a grid to visualize %
for x in range(0, 100, 10):
    draw.line([(x * w / 100, 0), (x * w / 100, h)], fill='red', width=1)
    draw.text((x * w / 100, 10), str(x)+'%', fill='red')

for y in range(0, 100, 10):
    draw.line([(0, y * h / 100), (w, y * h / 100)], fill='red', width=1)
    draw.text((10, y * h / 100), str(y)+'%', fill='red')

img.save('grid.jpg')
print('Grid saved to grid.jpg')
