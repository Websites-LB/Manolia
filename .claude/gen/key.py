"""Cut a subject off a flat coloured backdrop: key on the backdrop's hue, remove its spill, trim, save."""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 1400
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
h, w, _ = im.shape
edge = np.concatenate([im[:12].reshape(-1, 3), im[-12:].reshape(-1, 3), im[:, :12].reshape(-1, 3), im[:, -12:].reshape(-1, 3)])
bg = np.median(edge, axis=0)
k = bg - bg.mean()
khat = k / (np.linalg.norm(k) + 1e-6)
c = im - im.mean(axis=2, keepdims=True)
proj = (c * khat).sum(axis=2)
m = proj / (im.max(axis=2) + 0.04)
m_bg = float(np.dot(bg - bg.mean(), khat) / (bg.max() + 0.04))
t = np.clip((m - 0.3 * m_bg) / (0.42 * m_bg), 0, 1)
alpha = 1 - t * t * (3 - 2 * t)
# take the backdrop's colour out of what is left (its reflection on petals and soft edges)
rgb = np.clip(im - khat * np.clip(proj, 0, None)[..., None] * 1.0, 0, 1)
a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
a = np.asarray(a).astype(np.float32) / 255
a = np.clip((a - 0.12) / 0.8, 0, 1)
res = Image.fromarray((np.dstack([rgb, a]) * 255).astype(np.uint8), "RGBA")
ys, xs = np.where(a > 0.5)
pad = 10
box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(w, xs.max() + pad), min(h, ys.max() + pad))
res = res.crop(box)
res.thumbnail((size, size), Image.LANCZOS)
res.save(out)
# where the lowest part of the subject sits, as a fraction of the width (for stems: the cut end)
aa = np.asarray(res)[..., 3]
row = aa[int(aa.shape[0] * 0.97)]
cols = np.where(row > 128)[0]
print(out, res.size, "bg", (bg * 255).astype(int).tolist(), "base_x", round(float(cols.mean()) / aa.shape[1], 3) if len(cols) else None)
