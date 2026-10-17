/**
 * Every flower is described with the same parameters, so any two can be blended number by number.
 * Three petal whorls, each with up to MAX_SLOTS petals; a whorl a kind doesn't use has n = 0 and its
 * petals simply shrink away while the neighbouring ones slide round to fill the gap.
 */
export const MAX_SLOTS = 13;

export type Whorl = {
  /** petals in this whorl (fractional while morphing) */
  n: number;
  /** petal length and width, in flower radii */
  len: number;
  wid: number;
  /** 0 = pointed tip, 1 = broad rounded tip */
  round: number;
  /** depth of a notch at the tip (cosmos) */
  notch: number;
  /** wavy edge (rose, peony) */
  ruffle: number;
  /** angle from the flower's axis, radians: closed (bud) → open */
  tiltClosed: number;
  tiltOpen: number;
  /** how much the sides curl toward the axis */
  cup: number;
  /** extra outward bend toward the tip when open (lily) */
  recurve: number;
  /** distance of the petal base from the axis, in flower radii */
  ring: number;
  /** rotation of the whorl, radians */
  offset: number;
};

export type Kind = {
  name: string;
  whorls: [Whorl, Whorl, Whorl];
  /** petal colours: base (heart) → tip */
  base: string;
  tip: string;
  /** yellow disc in the middle (cosmos) and visible stamens (lily, tulip) — 0..1 */
  disc: number;
  stamens: number;
  stamenColor: string;
  /** foliage shade */
  leaf: string;
  /** a whisper of the flower's colour for the page behind it */
  glow: string;
  bg: string;
};

const W = (o: Partial<Whorl>): Whorl => ({
  n: 0,
  len: 0.8,
  wid: 0.6,
  round: 0.8,
  notch: 0,
  ruffle: 0,
  tiltClosed: 0.08,
  tiltOpen: 1,
  cup: 0.4,
  recurve: 0,
  ring: 0.04,
  offset: 0,
  ...o,
});

export const KINDS: Kind[] = [
  {
    name: "tulip",
    whorls: [
      W({ n: 3, len: 1.0, wid: 0.66, round: 0.55, tiltClosed: 0.1, tiltOpen: 0.82, cup: 0.6, ring: 0.06 }),
      W({ n: 3, len: 0.95, wid: 0.62, round: 0.55, tiltClosed: 0.04, tiltOpen: 0.62, cup: 0.6, ring: 0.04, offset: Math.PI / 3 }),
      W({ n: 0, len: 0.5, wid: 0.5 }),
    ],
    base: "#f7d3b4",
    tip: "#d9475a",
    disc: 0,
    stamens: 0.45,
    stamenColor: "#3d2a2c",
    leaf: "#6d8a5c",
    glow: "#f6dcd8",
    bg: "#f4ece6",
  },
  {
    name: "rose",
    whorls: [
      W({ n: 5, len: 0.96, wid: 0.98, round: 1, ruffle: 0.25, tiltClosed: 0.2, tiltOpen: 1.38, cup: 0.32, recurve: 0.35, ring: 0.08 }),
      W({ n: 5, len: 0.78, wid: 0.9, round: 1, ruffle: 0.2, tiltClosed: 0.1, tiltOpen: 0.98, cup: 0.5, recurve: 0.15, ring: 0.05, offset: 0.63 }),
      W({ n: 7, len: 0.56, wid: 0.72, round: 0.95, ruffle: 0.1, tiltClosed: 0.02, tiltOpen: 0.52, cup: 0.7, ring: 0.02, offset: 0.3 }),
    ],
    base: "#fff1e2",
    tip: "#f1a06e",
    disc: 0,
    stamens: 0,
    stamenColor: "#c58a3a",
    leaf: "#5d7d4d",
    glow: "#f8e3d2",
    bg: "#f5ede4",
  },
  {
    name: "lily",
    whorls: [
      W({ n: 3, len: 1.16, wid: 0.42, round: 0.08, tiltClosed: 0.08, tiltOpen: 1.42, cup: 0.32, recurve: 0.95, ring: 0.05 }),
      W({ n: 3, len: 1.1, wid: 0.5, round: 0.12, tiltClosed: 0.03, tiltOpen: 1.32, cup: 0.32, recurve: 0.8, ring: 0.04, offset: Math.PI / 3 }),
      W({ n: 0, len: 0.4, wid: 0.4 }),
    ],
    base: "#d8557c",
    tip: "#fffaf6",
    disc: 0,
    stamens: 1,
    stamenColor: "#b0602a",
    leaf: "#647f53",
    glow: "#f6e4e8",
    bg: "#f4eeec",
  },
  {
    name: "cosmos",
    whorls: [
      W({ n: 8, len: 1.02, wid: 0.4, round: 0.7, notch: 0.6, tiltClosed: 0.26, tiltOpen: 1.5, cup: 0.12, recurve: 0.05, ring: 0.14 }),
      W({ n: 0, len: 0.5, wid: 0.4, ring: 0.1, offset: 0.4 }),
      W({ n: 0, len: 0.3, wid: 0.3 }),
    ],
    base: "#8d6bc2",
    tip: "#d8cbef",
    disc: 1,
    stamens: 0,
    stamenColor: "#e3a92a",
    leaf: "#6f8c56",
    glow: "#e9e1f3",
    bg: "#f1edf0",
  },
  {
    name: "peony",
    whorls: [
      W({ n: 8, len: 1.0, wid: 0.92, round: 1, ruffle: 0.35, tiltClosed: 0.22, tiltOpen: 1.32, cup: 0.45, recurve: 0.2, ring: 0.08 }),
      W({ n: 10, len: 0.8, wid: 0.82, round: 1, ruffle: 0.3, tiltClosed: 0.12, tiltOpen: 0.98, cup: 0.6, ring: 0.05, offset: 0.3 }),
      W({ n: 13, len: 0.6, wid: 0.66, round: 1, ruffle: 0.25, tiltClosed: 0.03, tiltOpen: 0.58, cup: 0.75, ring: 0.02, offset: 0.15 }),
    ],
    base: "#ffe9e2",
    tip: "#ea7b72",
    disc: 0,
    stamens: 0.2,
    stamenColor: "#e8b648",
    leaf: "#5f7f4f",
    glow: "#f6ddd6",
    bg: "#f3ede3",
  },
];

/* ---------------------------------------------------------------- blending */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export type Rgb = [number, number, number];
export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const css = (c: Rgb, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const shade = (c: Rgb, k: number): Rgb => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];

export type Blend = Omit<Kind, "name" | "base" | "tip" | "stamenColor" | "leaf" | "glow" | "bg"> & {
  base: Rgb;
  tip: Rgb;
  stamenColor: Rgb;
  leaf: Rgb;
  glow: Rgb;
  bg: Rgb;
};

/** Number-by-number blend of two kinds (t = 0 → a, 1 → b). */
export function blend(a: Kind, b: Kind, t: number): Blend {
  const whorls = a.whorls.map((wa, i) => {
    const wb = b.whorls[i];
    const out = {} as Whorl;
    for (const k of Object.keys(wa) as (keyof Whorl)[]) out[k] = lerp(wa[k], wb[k], t);
    // a whorl that appears borrows its partner's shape, so it grows in rather than morphing from nothing
    if (wa.n === 0) Object.assign(out, { ...wb, n: lerp(0, wb.n, t) });
    if (wb.n === 0) Object.assign(out, { ...wa, n: lerp(wa.n, 0, t) });
    return out;
  }) as Blend["whorls"];
  return {
    whorls,
    disc: lerp(a.disc, b.disc, t),
    stamens: lerp(a.stamens, b.stamens, t),
    base: mixRgb(hexToRgb(a.base), hexToRgb(b.base), t),
    tip: mixRgb(hexToRgb(a.tip), hexToRgb(b.tip), t),
    stamenColor: mixRgb(hexToRgb(a.stamenColor), hexToRgb(b.stamenColor), t),
    leaf: mixRgb(hexToRgb(a.leaf), hexToRgb(b.leaf), t),
    glow: mixRgb(hexToRgb(a.glow), hexToRgb(b.glow), t),
    bg: mixRgb(hexToRgb(a.bg), hexToRgb(b.bg), t),
  };
}
