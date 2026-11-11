/**
 * Which photographs exist (public/art). Anything not listed here is painted in code instead, so the
 * site is whole with any subset of them. The photographs are generated stand-ins: swap in Manolia's
 * own pictures by replacing the files, same names and sizes.
 *  - stem-<kind>.webp   800×1280, transparent, the stem standing on the bottom edge with its cut end at the centre
 *  - head-<kind>.webp   a white bloom, trimmed, transparent: the painter tints it to any palette
 *  - hero.webp          1000×1100, transparent, stems ending at the bottom centre
 *  - product-<id>.webp  a full photograph on its own dark backdrop
 */
export const HERO_PHOTO = false;
export const STEM_PHOTOS: string[] = ["peony", "rose", "ranunculus"];
export const HEAD_PHOTOS: string[] = ["rose"];
export const PRODUCT_PHOTOS: string[] = [];

export const stemPhoto = (kind: string) => (STEM_PHOTOS.includes(kind) ? `/art/stem-${kind}.webp` : null);
export const productPhoto = (id: string) => (PRODUCT_PHOTOS.includes(id) ? `/art/product-${id}.webp` : null);
