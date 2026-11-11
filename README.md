# Manolia — The Floral Boutique

Website for Manolia, a floral boutique in Jbeil (Byblos), Lebanon: floral design, weddings and events.

- **Home**, told in chapters: an engraved, hand-coloured bouquet that draws itself stem by stem in front of the
  name set enormous (hero) · a manifesto that brightens word by word as you scroll · signature bouquets in a
  pinned sideways gallery · weddings, where a framed photo grows to fill the screen · the week's stems drifting
  past · how to order · visit.
- **Shop**: bouquets, boxes and vase arrangements with photographs; the bag sends the order to Manolia on WhatsApp.

## Stack

Next.js 15 · React 19 · Tailwind CSS 4 · GSAP + ScrollTrigger · Lenis · Radix UI · Framer Motion · Zustand

Type: Instrument Serif (display), Geist (text), Geist Mono (labels).

## The engraved bouquet (`src/lib/botanic`)

The hero illustration is generated, not a picture: seeded code draws peony, roses, ranunculus, anemone, buds,
leaves, eucalyptus, gypsophila and a silk tie the way a copper-plate botanical is drawn — fine outlines,
hatching from the base of each petal, and fills of the ground colour (tinted like a hand-coloured print) so
nearer petals hide the lines behind them. On load the paths are inked in the order a florist builds a bouquet.

See `CLAUDE.md` for how we work.

## Credits

- Shop photos: [Unsplash](https://unsplash.com) (free licence), stand-ins until Manolia's own photos

## Develop

```bash
npm install
npm run dev
```
