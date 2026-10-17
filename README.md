# Manolia — The Floral Boutique

Website for Manolia, a floral boutique in Jbeil (Byblos), Lebanon: floral design, weddings and events.

- **Home**: a hand-drawn-style 2D flower (canvas) that opens as you scroll and morphs, smoothly and continuously, from tulip to rose to lily to cosmos to peony, changing colour as it goes; the page takes on a soft wash of each flower's tone.
- **Shop**: bouquets, boxes and vase arrangements with photographs; the bag sends the order to Manolia on WhatsApp.

## Stack

Next.js 15 · React 19 · Tailwind CSS 4 · Canvas 2D · Radix UI · Framer Motion · Lenis · Zustand

## Flower drawing (`src/lib/bloom`)

Every flower is described with the same numbers (petal whorls, count, length, width, roundness, curl, tilt,
colours, centre), so any two can be blended value by value. Scrolling picks the pair and the blend amount; the
petals are laid out around the axis, sorted back to front and painted with gradient fills and fine ink lines.

## Credits

- Shop photos: [Unsplash](https://unsplash.com) (free licence), stand-ins until Manolia's own photos

## Develop

```bash
npm install
npm run dev
```
