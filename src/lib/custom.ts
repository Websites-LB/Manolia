/**
 * "Compose your own": the recipe a customer builds, what each part costs, and the checks the server
 * repeats before it trusts a price. No drawing in here, so the API routes can import it.
 * Prices are placeholders until Manolia confirms their list.
 */
export type Flower = "peony" | "rose" | "ranunculus" | "anemone" | "hydrangea" | "tulip";
export type PaletteId = "blush" | "ivory" | "sunset" | "lavender" | "ruby" | "harbour" | "garden";
export type WrapId = "ivory" | "kraft" | "box" | "vase";
export type Green = "eucalyptus" | "gypsophila";

export type Recipe = {
  stems: Record<Flower, number>;
  palette: PaletteId;
  greens: Green[];
  wrap: WrapId;
};

export const FLOWERS: { id: Flower; name: string; plural: string; price: number; note: string }[] = [
  { id: "peony", name: "Peony", plural: "peonies", price: 9, note: "The showpiece. Opens as wide as a hand." },
  { id: "rose", name: "Garden rose", plural: "garden roses", price: 5, note: "Full, scented, a little undone." },
  { id: "ranunculus", name: "Ranunculus", plural: "ranunculus", price: 4, note: "Hundreds of tissue-thin petals." },
  { id: "anemone", name: "Anemone", plural: "anemones", price: 4, note: "Paper petals round an inky eye." },
  { id: "hydrangea", name: "Hydrangea", plural: "hydrangeas", price: 12, note: "One stem fills a whole corner." },
  { id: "tulip", name: "Tulip", plural: "tulips", price: 4, note: "Keeps growing toward the light." },
];

export const PALETTES: { id: PaletteId; name: string; tints: string[] }[] = [
  { id: "blush", name: "Blush", tints: ["#f0b9ae", "#e3909a", "#f6d4cb"] },
  { id: "ivory", name: "Ivory", tints: ["#f3eadb", "#efe3c8", "#f7f1e6"] },
  { id: "sunset", name: "Sunset", tints: ["#f5c78f", "#f2a07e", "#e98b80"] },
  { id: "lavender", name: "Lavender", tints: ["#c9b5e6", "#b9a3e0", "#dcd0f0"] },
  { id: "ruby", name: "Ruby", tints: ["#b8434e", "#a2364c", "#d0616a"] },
  { id: "harbour", name: "Harbour", tints: ["#9fb6e0", "#b9a3e0", "#cfdcf2"] },
  { id: "garden", name: "Garden mix", tints: ["#f0b9ae", "#f5c78f", "#c9b5e6", "#e3909a", "#f3eadb"] },
];

export const GREENS: { id: Green; name: string; price: number; note: string }[] = [
  { id: "eucalyptus", name: "Eucalyptus", price: 6, note: "Silver-green, scented" },
  { id: "gypsophila", name: "Baby's breath", price: 8, note: "A soft white cloud" },
];

export const WRAPS: { id: WrapId; name: string; price: number; note: string }[] = [
  { id: "ivory", name: "Ivory paper", price: 0, note: "Hand-tied, silk ribbon" },
  { id: "kraft", name: "Kraft paper", price: 0, note: "Hand-tied, silk ribbon" },
  { id: "box", name: "Hat box", price: 18, note: "Packed tight in a round box" },
  { id: "vase", name: "Glass vase", price: 22, note: "Arranged, yours to keep" },
];

export const MIN_STEMS = 3;
export const MAX_STEMS = 30;
export const MAX_PER_FLOWER = 12;

export const EMPTY_STEMS: Record<Flower, number> = { peony: 0, rose: 0, ranunculus: 0, anemone: 0, hydrangea: 0, tulip: 0 };
export const STARTER: Recipe = { stems: { ...EMPTY_STEMS, peony: 2, rose: 4, ranunculus: 3 }, palette: "blush", greens: ["eucalyptus"], wrap: "ivory" };

export const stemCount = (r: Recipe) => FLOWERS.reduce((n, f) => n + r.stems[f.id], 0);

export function recipePrice(r: Recipe) {
  const flowers = FLOWERS.reduce((n, f) => n + r.stems[f.id] * f.price, 0);
  const greens = GREENS.reduce((n, g) => n + (r.greens.includes(g.id) ? g.price : 0), 0);
  return flowers + greens + (WRAPS.find((w) => w.id === r.wrap)?.price ?? 0);
}

/** "2 peonies · 4 garden roses · eucalyptus · ivory paper" */
export function recipeSummary(r: Recipe) {
  return [
    ...FLOWERS.filter((f) => r.stems[f.id] > 0).map((f) => `${r.stems[f.id]} ${r.stems[f.id] === 1 ? f.name.toLowerCase() : f.plural}`),
    ...GREENS.filter((g) => r.greens.includes(g.id)).map((g) => g.name.toLowerCase()),
    `${PALETTES.find((p) => p.id === r.palette)?.name.toLowerCase()} palette`,
    WRAPS.find((w) => w.id === r.wrap)?.name.toLowerCase(),
  ].join(" · ");
}

/** Same recipe, same key: two identical bouquets in the bag become one line with a quantity. */
export const recipeKey = (r: Recipe) =>
  `custom:${FLOWERS.map((f) => r.stems[f.id]).join(".")}:${r.palette}:${GREENS.map((g) => (r.greens.includes(g.id) ? 1 : 0)).join("")}:${r.wrap}`;

/** A composed bouquet as a short code for a link, and back. */
export const recipeCode = (r: Recipe) => recipeKey(r).slice(7).replace(/:/g, "~");
export function recipeFromCode(code: string | undefined): Recipe | null {
  const [stems, palette, greens, wrap] = (code ?? "").split("~");
  if (!stems || !greens) return null;
  const n = stems.split(".").map(Number);
  return cleanRecipe({
    stems: Object.fromEntries(FLOWERS.map((f, i) => [f.id, n[i] ?? 0])),
    palette,
    wrap,
    greens: GREENS.filter((_, i) => greens[i] === "1").map((g) => g.id),
  });
}

/** Accept only a well-formed recipe; anything else (a tampered request, an old bag) is dropped. */
export function cleanRecipe(input: unknown): Recipe | null {
  if (!input || typeof input !== "object") return null;
  const v = input as Partial<Recipe>;
  if (!PALETTES.some((p) => p.id === v.palette) || !WRAPS.some((w) => w.id === v.wrap) || !Array.isArray(v.greens) || !v.stems || typeof v.stems !== "object") return null;
  const stems = { ...EMPTY_STEMS };
  for (const f of FLOWERS) {
    const n = (v.stems as Record<string, unknown>)[f.id];
    if (n == null) continue;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > MAX_PER_FLOWER) return null;
    stems[f.id] = n;
  }
  const r: Recipe = { stems, palette: v.palette!, wrap: v.wrap!, greens: GREENS.map((g) => g.id).filter((g) => v.greens!.includes(g)) };
  const n = stemCount(r);
  return n >= MIN_STEMS && n <= MAX_STEMS ? r : null;
}

/* ───────────── florist's choice: "not sure what to send?" ───────────── */

/**
 * The customer does not pick flowers at all: they tell us the occasion, the colours, who it is for
 * and what to spend. That opens a conversation with the florist (see requests.ts), who proposes
 * something; nothing is paid until the customer says yes. Budget steps are placeholders.
 */
export type OccasionId = "birthday" | "love" | "thanks" | "getwell" | "baby" | "sympathy" | "because";
export type Brief = { occasion: OccasionId; palette: PaletteId | "surprise"; about: string; budget: number };

export const OCCASIONS: { id: OccasionId; name: string }[] = [
  { id: "birthday", name: "Birthday" },
  { id: "love", name: "Love" },
  { id: "thanks", name: "Thank you" },
  { id: "getwell", name: "Get well" },
  { id: "baby", name: "New baby" },
  { id: "sympathy", name: "Sympathy" },
  { id: "because", name: "Just because" },
];
export const BUDGETS = [45, 70, 100, 150];
export const BUDGET_MIN = 30;
export const BUDGET_MAX = 1500;
export const ABOUT_MAX = 400;

export function cleanBrief(input: unknown): Brief | null {
  if (!input || typeof input !== "object") return null;
  const v = input as Partial<Brief>;
  if (!OCCASIONS.some((o) => o.id === v.occasion)) return null;
  if (v.palette !== "surprise" && !PALETTES.some((p) => p.id === v.palette)) return null;
  if (typeof v.budget !== "number" || !Number.isInteger(v.budget) || v.budget < BUDGET_MIN || v.budget > BUDGET_MAX) return null;
  return { occasion: v.occasion!, palette: v.palette!, budget: v.budget, about: typeof v.about === "string" ? v.about.trim().slice(0, ABOUT_MAX) : "" };
}

/** "Birthday · blush colours · “she loves peonies, hates yellow”" */
export function briefSummary(b: Brief) {
  return [
    OCCASIONS.find((o) => o.id === b.occasion)?.name,
    b.palette === "surprise" ? "colours: florist's choice" : `${PALETTES.find((p) => p.id === b.palette)?.name.toLowerCase()} colours`,
    b.about && `“${b.about}”`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** A stand-in bouquet in the chosen colours, fuller as the budget grows. Only for the picture: the florist decides the stems. */
export function briefRecipe(b: Brief): Recipe {
  const k = b.budget < 60 ? 0 : b.budget < 90 ? 1 : b.budget < 130 ? 2 : 3;
  return {
    stems: { ...EMPTY_STEMS, peony: 1 + (k > 1 ? 1 : 0) + (k > 2 ? 1 : 0), rose: 2 + k, ranunculus: 2 + (k > 0 ? 1 : 0), anemone: k > 1 ? 2 : 0 },
    palette: b.palette === "surprise" ? "garden" : b.palette,
    greens: k > 0 ? ["eucalyptus", "gypsophila"] : ["eucalyptus"],
    wrap: "ivory",
  };
}
