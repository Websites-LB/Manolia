# Manolia — The Floral Boutique

Website for Manolia, a floral boutique in Jbeil (Byblos), Lebanon: floral design, weddings and events.

- **Home**: a scroll-driven 3D bouquet that grows and blooms in a hand-painted vase while the story of the boutique unfolds.
- **Shop**: bouquets, hat boxes and vase arrangements, each rendered in 3D from the same flower engine; the bag sends the order to Manolia on WhatsApp.

## Stack

Next.js 15 · React 19 · Tailwind CSS 4 · three.js · Radix UI · Framer Motion · Lenis · Zustand

## Flower engine (`src/lib/flora`)

Roses, peonies, hydrangeas, eucalyptus and baby's breath are generated procedurally. Every petal blends between a bud
and an open pose (morph targets on instanced meshes), so whole bouquets can grow and bloom live at 60 fps.

## Credits

- Vase: [Antique Ceramic Vase 01](https://polyhaven.com/a/antique_ceramic_vase_01), Poly Haven, CC0
- Lighting: [Brown Photostudio 02](https://polyhaven.com/a/brown_photostudio_02), Poly Haven, CC0

## Develop

```bash
npm install
npm run dev
```
