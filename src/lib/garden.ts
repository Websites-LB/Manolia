import type { Kind } from "./botanic/specimen";

export type Bloom = {
  id: string;
  kind: Kind;
  tint: string;
  /** set in the display serif; *asterisks* mark the italic part */
  name: string;
  latin: string;
  line: string;
  season: string;
  meaning: string;
  colours: string;
  /** product ids that carry this flower; empty means made to order */
  in: string[];
};

/** The flowers that grow along the roots, top to bottom. */
export const BLOOMS: Bloom[] = [
  {
    id: "peony",
    kind: "peony",
    tint: "#f0b9ae",
    name: "Peony",
    latin: "Paeonia lactiflora",
    line: "A tight green ball on Monday, an armful of silk by Thursday. The flower people ask for by name.",
    season: "Late spring",
    meaning: "Romance, good fortune",
    colours: "Blush, coral, ivory",
    in: ["old-souk", "maison"],
  },
  {
    id: "rose",
    kind: "rose",
    tint: "#e3909a",
    name: "Garden *rose*",
    latin: "Rosa",
    line: "Not the stiff long-stem kind: full, scented, a little undone. The backbone of almost everything we tie.",
    season: "All year",
    meaning: "Love, in every shade",
    colours: "Ivory, blush, lavender, deep red",
    in: ["jbeil-morning", "first-dance", "lavender-hour", "velvet-box", "blush-box"],
  },
  {
    id: "anemone",
    kind: "anemone",
    tint: "#c9b5e6",
    name: "Anemone",
    latin: "Anemone coronaria",
    line: "It grows wild on the hills of Lebanon every winter. Inky eye, paper petals, gone in a week — so we use it while it lasts.",
    season: "Winter to spring",
    meaning: "Anticipation",
    colours: "Red, white, violet",
    in: [],
  },
  {
    id: "ranunculus",
    kind: "ranunculus",
    tint: "#f5c78f",
    name: "Ranunculus",
    latin: "Ranunculus asiaticus",
    line: "Another Eastern Mediterranean native: hundreds of tissue-thin petals wound round a green heart.",
    season: "Winter to spring",
    meaning: "Radiant charm",
    colours: "Apricot, butter, blush",
    in: [],
  },
  {
    id: "hydrangea",
    kind: "hydrangea",
    tint: "#9fb6e0",
    name: "Hydrangea",
    latin: "Hydrangea macrophylla",
    line: "One stem is a whole bouquet. Blue like the harbour below the citadel, or violet at dusk.",
    season: "Summer",
    meaning: "Gratitude",
    colours: "Harbour blue, violet, white",
    in: ["harbour-blue", "citadel"],
  },
  {
    id: "tulip",
    kind: "tulip",
    tint: "#e98b80",
    name: "Tulip",
    latin: "Tulipa",
    line: "Keeps growing in the vase and turns toward the light. Never the same arrangement two days running.",
    season: "Winter to spring",
    meaning: "Perfect love",
    colours: "Coral, white, burgundy, parrot",
    in: [],
  },
];
