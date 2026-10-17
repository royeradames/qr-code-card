import glob, sys
from PIL import Image, ImageChops
worst = 0
for b in sorted(glob.glob('shot-base-*.png')):
    h = b.replace('shot-base-', 'shot-head-')
    A, B = Image.open(b).convert('RGB'), Image.open(h).convert('RGB')
    if A.size != B.size:
        print(f"SIZE {b[10:-4]} base {A.size} head {B.size}"); worst = 100; continue
    d = ImageChops.difference(A, B); n = sum(1 for px in d.getdata() if max(px) > 16)
    pct = 100 * n / (A.size[0] * A.size[1]); worst = max(worst, pct)
    if n: d.point(lambda v: 255 if v > 16 else 0).save(b.replace('shot-base-', 'diff-'))
    print(f"shot {b[10:-4]:40} differing pixels {n} ({pct:.3f}%)")
print(f"shots worst {worst:.3f}%")
