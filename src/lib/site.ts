export const SITE = {
  name: "Manolia",
  tagline: "The Floral Boutique",
  whatsapp: "96170437792",
  whatsappDisplay: "+961 70 437 792",
  instagram: "https://www.instagram.com/manoliathefloralboutique/",
  instagramHandle: "@manoliathefloralboutique",
  address: "Jbeil, Byblos — near Nobilis Center",
  mapsQuery: "Manolia The Floral Boutique, Jbeil, Lebanon",
};

export const waLink = (text?: string) =>
  `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Where we deliver and what it costs. Placeholder zones and fees until Manolia confirms theirs. */
export const DELIVERY_ZONES = [
  { id: "jbeil", name: "Jbeil & Amchit", fee: 3 },
  { id: "batroun", name: "Batroun", fee: 6 },
  { id: "kesrwan", name: "Jounieh & Kesrwan", fee: 6 },
  { id: "beirut", name: "Beirut & Metn", fee: 10 },
];

export const SLOTS = ["Morning, 9 to 12", "Afternoon, 12 to 4", "Evening, 4 to 8"];
