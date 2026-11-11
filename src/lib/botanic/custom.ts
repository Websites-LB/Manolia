/**
 * Draws the bouquet a customer composes: every stem they pick becomes a head in the dome, in their
 * palette, with their greenery, in the paper, box or vase they chose. Same hand as the shop plates.
 */
import { FLOWERS, PALETTES, type Flower, type Recipe } from "../custom";
import type { Piece } from "./bouquet";
import { clamp, rng, smooth, type Pt } from "./geometry";
import { eucalyptus, gypsophila, leaf, ribbon, stem, type Stroke } from "./parts";
import { bloom, glassVase, hatBox } from "./specimen";

const SAGE = "#8fb08a";
const SIZE: Record<Flower, number> = { hydrangea: 1.28, peony: 1.18, rose: 1, anemone: 0.86, ranunculus: 0.8, tulip: 0.62 };
/** more stems than this are drawn as this many, a little fuller */
const DRAWN = 17;
const PAPER = { ivory: "#ece3cf", kraft: "#b99266" };

export function buildCustom(recipe: Recipe, seed = 5): Piece[] {
  const r = rng(seed);
  const pieces: Piece[] = [];
  const add = (id: string, strokes: Stroke[], tint = SAGE) => pieces.push({ id, strokes, tint, sway: 0 });
  const tints = PALETTES.find((p) => p.id === recipe.palette)?.tints ?? PALETTES[0].tints;
  const { wrap } = recipe;
  const paper = wrap === "ivory" || wrap === "kraft";

  // every stem, biggest flowers first so they take the heart of the dome
  let kinds: Flower[] = FLOWERS.flatMap((f) => Array.from({ length: recipe.stems[f.id] }, () => f.id)).sort((a, b) => SIZE[b] - SIZE[a]);
  if (kinds.length > DRAWN) kinds = Array.from({ length: DRAWN }, (_, i) => kinds[Math.floor((i * kinds.length) / DRAWN)]);
  const n = Math.max(1, kinds.length);

  const grow = clamp(Math.sqrt(n / 9), 0.6, wrap === "vase" ? 0.98 : 1.08);
  const cx = 300;
  const cy = wrap === "box" ? 318 : wrap === "vase" ? 286 : 296;
  const rx = (wrap === "box" ? 168 : 185) * grow;
  const ry = (wrap === "box" ? 96 : 138) * grow;
  const unit = Math.sqrt((1.45 * rx * ry) / n);
  const tie: Pt = wrap === "vase" ? [300, 690] : [300, 572];
  const phase = r.range(0, 6);

  const heads = kinds.map((kind, i) => {
    const rad = Math.sqrt((i + 0.35) / n);
    const ang = i * 2.39996 + phase;
    const at: Pt = [cx + Math.cos(ang) * rx * rad + r.jitter(5), cy + Math.sin(ang) * ry * rad + r.jitter(5)];
    return { kind, at, radius: unit * SIZE[kind] * r.range(0.94, 1.06), tilt: ((at[0] - cx) / rx) * 24 + r.jitter(6), tint: tints[i % tints.length] };
  });

  if (wrap === "box") add("box", hatBox(cx, 430, 200, 56), "#d8c4a6");

  // the sheet of paper behind everything
  if (paper) {
    const back: Pt[] = [
      [96, 402],
      [176, 326],
      [300, 350],
      [424, 322],
      [506, 398],
      [334, 734],
      [268, 734],
    ];
    add("paper-back", [{ d: smooth(back, true, 0.35), w: 1.1, o: 0.6, ink: 0.92, fill: true, paint: { kind: "linear", a: [300, 320], b: [300, 740], stops: [[0, 0.34], [1, 0.14]] } }], PAPER[wrap as "ivory" | "kraft"]);
  }

  if (recipe.greens.includes("gypsophila")) {
    const sprays: [number, number][] = [
      [-150, 1.16],
      [-88, 1.2],
      [-32, 1.14],
    ];
    sprays.forEach(([deg, k], i) => {
      const a = (deg * Math.PI) / 180;
      const at: Pt = [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k - 12];
      add(`gyp-${i}`, [...stem(tie, at, r.jitter(18), false, r, 2.2), ...gypsophila(at, deg + 90, 46 + 10 * grow, r)]);
    });
  }
  if (recipe.greens.includes("eucalyptus")) {
    // in a vase the branches leave from its mouth, not from the water
    const from: Pt = wrap === "vase" ? [300, 474] : tie;
    add("euca-l", eucalyptus(from, [cx - rx - 78, cy + ry * 0.75], 44, r));
    add("euca-r", eucalyptus(from, [cx + rx + 74, cy + ry * 0.85], -44, r));
  }

  if (wrap !== "box") {
    add("stems", heads.flatMap((h) => stem(tie, h.at, r.jitter(14), h.radius > 70, r)));
    add("leaves", [...leaf([tie[0] - 10, wrap === "vase" ? 470 : tie[1] - 40], 150, 30, -60, 0.16, r), ...leaf([tie[0] + 10, wrap === "vase" ? 470 : tie[1] - 40], 150, 30, 62, -0.16, r)]);
  }

  // back of the dome first, so the heads toward us cover the ones behind
  [...heads].sort((a, b) => a.at[1] - b.at[1]).forEach((h, i) => pieces.push({ id: `h${i}`, strokes: bloom(h.kind, h.at, h.radius, h.tilt, r), tint: h.tint, sway: 0, sprite: { kind: h.kind, at: h.at, radius: h.radius, tilt: h.tilt } }));

  if (wrap === "vase") add("vase", glassVase(), "#c9d8d4");
  if (paper) {
    // two flaps folded across the stems, the right over the left
    const flap = (s: 1 | -1, tone: number): Stroke[] => {
      const x = (v: number) => 300 + s * v;
      const pts: Pt[] = [
        [x(-204), 402],
        [x(-92), 498],
        [x(22), 640],
        [x(14), 738],
        [x(-34), 734],
      ];
      return [
        { d: smooth(pts, true, 0.3), w: 1.1, o: 0.65, ink: 0.94, fill: true, paint: { kind: "linear", a: [x(-204), 402], b: [x(20), 700], stops: [[0, tone + 0.2], [0.6, tone], [1, tone - 0.16]] } },
        { d: smooth([[x(-180), 420], [x(-60), 560], [x(-6), 700]]), w: 0.75, o: 0.4, ink: 0.1 },
        { d: smooth([[x(-150), 420], [x(-30), 590]]), w: 0.75, o: 0.3, ink: 0.1 },
      ];
    };
    add("paper-left", flap(1, 0.44), PAPER[wrap as "ivory" | "kraft"]);
    add("paper-right", flap(-1, 0.56), PAPER[wrap as "ivory" | "kraft"]);
    add("ribbon", ribbon([300, 642], r), tints[0]);
  }
  return pieces;
}
