# Manolia — The Floral Boutique

Website for Manolia, a floral boutique in Jbeil (Byblos), Lebanon: floral design, weddings and events.

- **Home**: a single 3D water lily that opens as you scroll and, between chapters, folds and reopens in a new colour (blush, peach, butter, lilac, rose) while the page takes on a soft wash of the same tone.
- **Shop**: bouquets, boxes and vase arrangements with photographs; the bag sends the order to Manolia on WhatsApp.

## Stack

Next.js 15 · React 19 · Tailwind CSS 4 · three.js · Radix UI · Framer Motion · Lenis · Zustand

## Flower engine (`src/lib/flora`)

The water lily is procedural: every petal blends between a bud pose and an open pose (morph targets on one
instanced mesh), and its colour is two shader uniforms, so it can open and change colour live at 60 fps.

## Credits

- Lighting: [Brown Photostudio 02](https://polyhaven.com/a/brown_photostudio_02), Poly Haven, CC0
- Shop photos: [Unsplash](https://unsplash.com) (free licence), stand-ins until Manolia's own photos

## Develop

```bash
npm install
npm run dev
```
