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
