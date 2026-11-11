/** Mix two #rrggbb colours: t = 0 gives `a`, t = 1 gives `b`. */
export function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => {
    const x = (pa >> s) & 255;
    const y = (pb >> s) & 255;
    return Math.round(x + (y - x) * Math.max(0, Math.min(1, t)));
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

const hsl = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
const hex = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255);
  return `#${((to(r) << 16) | (to(g) << 8) | to(b)).toString(16).padStart(6, "0")}`;
};

const cache = new Map<string, string>();
/**
 * One pigment at every strength, the way a petal is painted: 0 is the deep, saturated shadow at the
 * base, 0.5 the colour itself, 1 the pale edge where the light comes through.
 */
export function pigment(tint: string, t: number) {
  const q = Math.round(Math.max(0, Math.min(1, t)) * 50) / 50;
  const key = tint + q;
  const hit = cache.get(key);
  if (hit) return hit;
  const [h, s, l] = hsl(tint);
  const deep = hex(h, Math.min(1, s * 1.12 + 0.06), l * 0.34);
  const light = mixHex(tint, "#fff8ee", 0.62);
  const out = q < 0.5 ? mixHex(deep, tint, q * 2) : mixHex(tint, light, (q - 0.5) * 2);
  cache.set(key, out);
  return out;
}
