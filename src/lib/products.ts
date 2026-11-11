import type { Kind, Style } from "./botanic/specimen";

export type Category = "bouquets" | "boxes" | "vases";

export type Product = {
  id: string;
  name: string;
  category: Category;
  /** USD — placeholder prices until Manolia confirms their list. */
  price: number;
  blurb: string;
  stems: string;
  /** How the piece is drawn on its plate: the main flower, the arrangement and its colour. */
  art: { flower: Kind; style: Style; tint: string; seed: number };
};

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bouquets", label: "Hand-tied" },
  { id: "boxes", label: "Boxes" },
  { id: "vases", label: "In a vase" },
];

export const PRODUCTS: Product[] = [
  {
    id: "jbeil-morning",
    name: "Jbeil Morning",
    category: "bouquets",
    price: 65,
    blurb: "Soft pink roses with waxflower and silver eucalyptus, loosely tied and wrapped in ivory paper.",
    stems: "Roses · waxflower · eucalyptus",
    art: { flower: "rose", style: "posy", tint: "#f0b9ae", seed: 3 },
  },
  {
    id: "old-souk",
    name: "Old Souk",
    category: "bouquets",
    price: 85,
    blurb: "An armful of pink peonies in kraft paper, warm as stone walls at golden hour.",
    stems: "Peonies · kraft wrap",
    art: { flower: "peony", style: "posy", tint: "#f2b48c", seed: 5 },
  },
  {
    id: "first-dance",
    name: "First Dance",
    category: "bouquets",
    price: 120,
    blurb: "Our bridal signature: ivory garden roses, white blooms and trailing greenery, finished with silk ribbon.",
    stems: "Bridal · garden roses · greenery",
    art: { flower: "rose", style: "posy", tint: "#f3eadb", seed: 8 },
  },
  {
    id: "lavender-hour",
    name: "Lavender Hour",
    category: "bouquets",
    price: 90,
    blurb: "A dense dome of lavender roses, wrapped in white: a quiet palette for evenings.",
    stems: "Lavender roses",
    art: { flower: "rose", style: "posy", tint: "#c9b5e6", seed: 13 },
  },
  {
    id: "velvet-box",
    name: "Velvet",
    category: "boxes",
    price: 95,
    blurb: "Deep red roses packed tight in a round keepsake box. The classic, done properly.",
    stems: "Red roses · keepsake box",
    art: { flower: "rose", style: "box", tint: "#b8434e", seed: 21 },
  },
  {
    id: "blush-box",
    name: "Blush",
    category: "boxes",
    price: 85,
    blurb: "Pale pink roses in our black hat box, tied with a silk ribbon and a handwritten tag.",
    stems: "Pink roses · hat box",
    art: { flower: "rose", style: "box", tint: "#f0b9ae", seed: 34 },
  },
  {
    id: "harbour-blue",
    name: "Harbour Blue",
    category: "vases",
    price: 110,
    blurb: "Blue hydrangea heads gathered close, after the sea below the citadel.",
    stems: "Hydrangea",
    art: { flower: "hydrangea", style: "vase", tint: "#9fb6e0", seed: 55 },
  },
  {
    id: "maison",
    name: "Maison",
    category: "vases",
    price: 140,
    blurb: "Blush peonies arranged loose and tall in a glass vase. Yours to keep.",
    stems: "Peonies · glass vase",
    art: { flower: "peony", style: "vase", tint: "#f0b9ae", seed: 89 },
  },
  {
    id: "citadel",
    name: "Citadel",
    category: "vases",
    price: 75,
    blurb: "A few stems of violet-blue hydrangea in a simple glass vase, for a desk or a bedside.",
    stems: "Hydrangea · glass vase",
    art: { flower: "hydrangea", style: "vase", tint: "#b9a3e0", seed: 144 },
  },
];

