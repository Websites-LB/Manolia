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
  /**
   * Unsplash photo id (free licence), hotlinked from images.unsplash.com as Unsplash asks.
   * Stand-ins until Manolia's own product photos replace them.
   */
  photo: string;
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
    photo: "1533793241176-a270e75ef2ad",
  },
  {
    id: "old-souk",
    name: "Old Souk",
    category: "bouquets",
    price: 85,
    blurb: "An armful of pink peonies in kraft paper, warm as stone walls at golden hour.",
    stems: "Peonies · kraft wrap",
    photo: "1560583035-79c3e11ae176",
  },
  {
    id: "first-dance",
    name: "First Dance",
    category: "bouquets",
    price: 120,
    blurb: "Our bridal signature: ivory garden roses, white blooms and trailing greenery, finished with silk ribbon.",
    stems: "Bridal · garden roses · greenery",
    photo: "1578534102052-70f4c14ee0e7",
  },
  {
    id: "lavender-hour",
    name: "Lavender Hour",
    category: "bouquets",
    price: 90,
    blurb: "A dense dome of lavender roses, wrapped in white: a quiet palette for evenings.",
    stems: "Lavender roses",
    photo: "1609338682700-ea188bcdfa85",
  },
  {
    id: "velvet-box",
    name: "Velvet",
    category: "boxes",
    price: 95,
    blurb: "Deep red roses packed tight in a round keepsake box. The classic, done properly.",
    stems: "Red roses · keepsake box",
    photo: "1548094967-e25a127d1f6d",
  },
  {
    id: "blush-box",
    name: "Blush",
    category: "boxes",
    price: 85,
    blurb: "Pale pink roses in our black hat box, tied with a silk ribbon and a handwritten tag.",
    stems: "Pink roses · hat box",
    photo: "1771085417618-c69f6209e540",
  },
  {
    id: "harbour-blue",
    name: "Harbour Blue",
    category: "vases",
    price: 110,
    blurb: "Blue hydrangea heads gathered close, after the sea below the citadel.",
    stems: "Hydrangea",
    photo: "1613916107413-4991c04f0837",
  },
  {
    id: "maison",
    name: "Maison",
    category: "vases",
    price: 140,
    blurb: "Blush peonies arranged loose and tall in a glass vase. Yours to keep.",
    stems: "Peonies · glass vase",
    photo: "1616148037989-4c3a9946a514",
  },
  {
    id: "citadel",
    name: "Citadel",
    category: "vases",
    price: 75,
    blurb: "A few stems of violet-blue hydrangea in a simple glass vase, for a desk or a bedside.",
    stems: "Hydrangea · glass vase",
    photo: "1585738460883-62b4205281bf",
  },
];

/** Builds a sized, cropped Unsplash URL for a product photo. */
export const photoUrl = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${Math.round(width * 1.25)}&q=80`;

const BLUSH = "#f2c9c4";
const IVORY = "#f6efe2";
const ROSE = "#e9a3a6";
const PEACH = "#f3c19d";
const HYD_BLUE = "#7f9fd4";
const HYD_WHITE = "#eef1ea";
const PEONY_PINK = "#f0a9b9";
const PEONY_CORAL = "#f08b7d";

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
