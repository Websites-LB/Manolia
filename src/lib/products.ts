import type { Recipe } from "./flora/bouquet";

export type Category = "bouquets" | "boxes" | "vases";

export type Product = {
  id: string;
  name: string;
  category: Category;
  /** USD — placeholder prices until Manolia confirms their list. */
  price: number;
  blurb: string;
  stems: string;
  recipe: Recipe;
};

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bouquets", label: "Hand-tied" },
  { id: "boxes", label: "Hat boxes" },
  { id: "vases", label: "In a vase" },
];

const BLUSH = "#f2c9c4";
const IVORY = "#f6efe2";
const ROSE = "#e9a3a6";
const CRIMSON = "#8e1b2c";
const PEACH = "#f3c19d";
const LILAC = "#c9b3d9";
const HYD_BLUE = "#7f9fd4";
const HYD_WHITE = "#eef1ea";
const PEONY_PINK = "#f0a9b9";
const PEONY_CORAL = "#f08b7d";

export const PRODUCTS: Product[] = [
  {
    id: "jbeil-morning",
    name: "Jbeil Morning",
    category: "bouquets",
    price: 65,
    blurb: "Blush garden roses, a cloud of baby's breath and silver eucalyptus, wrapped in kraft and ivory tissue.",
    stems: "Garden roses · gypsophila · eucalyptus",
    recipe: { container: "wrap", seed: 3, roses: [BLUSH, BLUSH, IVORY, BLUSH, ROSE, IVORY, BLUSH], babys: 10, eucalyptus: 5 },
  },
  {
    id: "old-souk",
    name: "Old Souk",
    category: "bouquets",
    price: 85,
    blurb: "Coral and pink peonies with peach roses — warm as stone walls at golden hour.",
    stems: "Peonies · roses · eucalyptus",
    recipe: { container: "wrap", seed: 11, peonies: [PEONY_CORAL, PEONY_PINK, PEONY_PINK], roses: [PEACH, PEACH, IVORY, PEACH], eucalyptus: 6, babys: 4 },
  },
  {
    id: "harbour-blue",
    name: "Harbour Blue",
    category: "bouquets",
    price: 90,
    blurb: "Blue and white hydrangea with ivory roses, after the sea below the citadel.",
    stems: "Hydrangea · roses · gypsophila",
    recipe: { container: "wrap", seed: 21, hydrangeas: [HYD_BLUE, HYD_WHITE], roses: [IVORY, IVORY, IVORY, IVORY], babys: 8, eucalyptus: 3 },
  },
  {
    id: "first-dance",
    name: "First Dance",
    category: "bouquets",
    price: 120,
    blurb: "Our bridal signature: ivory roses and white peonies, softly loose, finished with silk ribbon.",
    stems: "Bridal · roses · peonies",
    recipe: { container: "wrap", seed: 33, roses: [IVORY, IVORY, IVORY, IVORY, IVORY], peonies: [IVORY, "#fbe7e4"], babys: 12, eucalyptus: 4 },
  },
  {
    id: "velvet-box",
    name: "Velvet",
    category: "boxes",
    price: 95,
    blurb: "Deep crimson roses set tight in our forest-green hat box with a gold rim.",
    stems: "Red roses · hat box",
    recipe: { container: "box", seed: 5, roses: Array(13).fill(CRIMSON) },
  },
  {
    id: "blush-box",
    name: "Blush",
    category: "boxes",
    price: 85,
    blurb: "Blush and ivory roses with tufts of baby's breath, packed by hand in our signature box.",
    stems: "Roses · gypsophila · hat box",
    recipe: { container: "box", seed: 8, roses: [BLUSH, IVORY, BLUSH, ROSE, BLUSH, IVORY, BLUSH, IVORY, BLUSH, ROSE, BLUSH], babys: 5 },
  },
  {
    id: "lilac-box",
    name: "Lavender Hour",
    category: "boxes",
    price: 105,
    blurb: "Lilac roses and a single blue hydrangea, a quiet palette for evenings.",
    stems: "Lilac roses · hydrangea · hat box",
    recipe: { container: "box", seed: 13, roses: [LILAC, LILAC, LILAC, IVORY, LILAC, LILAC, LILAC, IVORY], hydrangeas: [HYD_BLUE], babys: 3 },
  },
  {
    id: "maison",
    name: "Maison",
    category: "vases",
    price: 140,
    blurb: "A tall, generous arrangement in a hand-glazed antique ceramic vase. Yours to keep.",
    stems: "Peonies · roses · hydrangea · vase",
    recipe: { container: "vase", seed: 41, roses: [BLUSH, IVORY, BLUSH, ROSE, IVORY, BLUSH, IVORY, ROSE], peonies: [PEONY_PINK, IVORY, PEONY_PINK], hydrangeas: [HYD_WHITE, HYD_WHITE], babys: 14, eucalyptus: 7 },
  },
  {
    id: "citadel",
    name: "Citadel",
    category: "vases",
    price: 160,
    blurb: "Blue hydrangea, ivory peonies and roses: the palette of our evening events, for your table.",
    stems: "Hydrangea · peonies · roses · vase",
    recipe: { container: "vase", seed: 52, hydrangeas: [HYD_BLUE, HYD_BLUE, HYD_WHITE, HYD_BLUE], peonies: [IVORY, IVORY], roses: [IVORY, IVORY, IVORY, IVORY, IVORY, IVORY], babys: 12, eucalyptus: 7 },
  },
];

/** The hero's signature arrangement. */
export const HERO_RECIPE: Recipe = {
  container: "vase",
  seed: 9,
  roses: [BLUSH, IVORY, BLUSH, ROSE, IVORY, BLUSH, PEACH, IVORY, BLUSH, ROSE],
  peonies: [PEONY_PINK, IVORY, PEONY_PINK, PEONY_CORAL],
  hydrangeas: [HYD_WHITE, HYD_BLUE, HYD_BLUE],
  babys: 18,
  eucalyptus: 8,
};
