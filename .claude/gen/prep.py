"""
Turn a generated photograph on a flat backdrop into a site asset.
  prep.py cut  <src> <out.webp> <W> <H>   key the backdrop out, stand the subject on the bottom edge of a W:H plate, base centred
  prep.py head <src> <out.webp>           key the backdrop out and trim tight (for tintable flower heads)
  prep.py full <src> <out.webp>           no cut-out: just resize (photographs shown with their own dark backdrop)
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

mode, src, out = sys.argv[1:4]

def key(path):
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255
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
    rgb = np.clip(im - khat * np.clip(proj, 0, None)[..., None], 0, 1)
    a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    a = np.clip((np.asarray(a).astype(np.float32) / 255 - 0.12) / 0.8, 0, 1)
    res = Image.fromarray((np.dstack([rgb, a]) * 255).astype(np.uint8), "RGBA")
    ys, xs = np.where(a > 0.5)
    return res.crop((max(0, xs.min() - 4), max(0, ys.min() - 4), min(w, xs.max() + 4), min(h, ys.max() + 4))), bg

if mode == "full":
    im = Image.open(src).convert("RGB")
    im.thumbnail((1200, 1600), Image.LANCZOS)
    im.save(out, "WEBP", quality=84)
    print(out, im.size)
elif mode == "head":
    res, bg = key(src)
    res.thumbnail((640, 640), Image.LANCZOS)
    res.save(out, "WEBP", quality=90)
    print(out, res.size, "backdrop", (bg * 255).astype(int).tolist())
else:
    W, H = int(sys.argv[4]), int(sys.argv[5])
    res, bg = key(src)
    # fit inside the plate, standing on its bottom edge, with the cut end of the stem at the centre
    s = min(W * 0.96 / res.width, H * 0.985 / res.height)
    res = res.resize((round(res.width * s), round(res.height * s)), Image.LANCZOS)
    a = np.asarray(res)[..., 3]
    cols = np.where(a[int(a.shape[0] * 0.975)] > 128)[0]
    base = float(cols.mean()) if len(cols) else res.width / 2
    x = round(W / 2 - base)
    x = max(min(x, W - res.width), 0) if res.width <= W else x
    plate = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    plate.alpha_composite(res, (max(0, x), H - res.height)) if x >= 0 else plate.alpha_composite(res.crop((-x, 0, res.width, res.height)), (0, H - res.height))
    plate.save(out, "WEBP", quality=88)
    print(out, plate.size, "subject", res.size, "base at", round((x + base) / W, 3), "backdrop", (bg * 255).astype(int).tolist())
