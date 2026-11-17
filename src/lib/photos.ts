/**
 * Which photographs exist (public/art). Anything not listed here is painted in code instead, so the
 * site is whole with any subset of them. The photographs are generated stand-ins: swap in Manolia's
 * own pictures by replacing the files, same names and sizes.
 *  - stem-<kind>.webp   800×1280, transparent, the stem standing on the bottom edge with its cut end at the centre
 *  - head-<kind>.webp   a white bloom, trimmed, transparent: the painter tints it to any palette
 *  - hero-bouquet.webp  2:3 portrait, a bouquet on a dark backdrop; its edges fade into the night
 *  - product-<id>.webp  4:5, a full photograph on its own backdrop
 *  - door-*.webp        4:5, the three ways to order on the home page
 * The current photographs are public-domain (CC0) pictures from Wikimedia Commons; see public/art/CREDITS.md.
 */
export const HERO_PHOTO = true;
export const STEM_PHOTOS: string[] = ["peony", "rose", "ranunculus"];
export const HEAD_PHOTOS: string[] = ["rose"];
export const PRODUCT_PHOTOS: string[] = ["jbeil-morning", "old-souk", "first-dance", "lavender-hour", "velvet-box", "blush-box", "harbour-blue", "maison", "citadel"];

export const stemPhoto = (kind: string) => (STEM_PHOTOS.includes(kind) ? `/art/stem-${kind}.webp` : null);
export const productPhoto = (id: string) => (PRODUCT_PHOTOS.includes(id) ? `/art/product-${id}.webp` : null);
