# Manolia — The Floral Boutique

Website for Manolia, a floral boutique in Jbeil (Byblos), Lebanon: floral design, weddings and events.

- **Home**: an engraved, hand-coloured bouquet draws itself stem by stem in front of the name (hero). Below it the
  page becomes one long illustrated plate: a root grows down as you scroll, and every flower we work with —
  peony, garden rose, anemone, ranunculus, hydrangea, tulip — sprouts from it with its Latin name, season,
  meaning, colours and the bouquets it is in. Weddings & events (gypsophila), how to order (eucalyptus) and the
  visit grow off the same root. Engraved butterflies drift over everything and shy away from the cursor.
- **Shop**: every bouquet, box and vase is drawn as an engraved plate in its own colours (no stock photos);
  the bag sends the order to Manolia on WhatsApp.

## Stack

Next.js 15 · React 19 · Tailwind CSS 4 · GSAP + ScrollTrigger · Lenis · Radix UI · Framer Motion · Zustand

Type: Instrument Serif (display), Geist (text), Geist Mono (labels).

## The engraved bouquet (`src/lib/botanic`)

The hero illustration is generated, not a picture: seeded code draws peony, roses, ranunculus, anemone, buds,
leaves, eucalyptus, gypsophila and a silk tie the way a copper-plate botanical is drawn — fine outlines,
hatching from the base of each petal, and fills of the ground colour (tinted like a hand-coloured print) so
nearer petals hide the lines behind them. On load the paths are inked in the order a florist builds a bouquet.
The same parts make the single specimens along the root (`specimen.ts`), the shop plates (posy, hat box,
vase) and the root system itself (`roots.ts`), which is threaded through each flower's stem base after layout.

See `CLAUDE.md` for how we work.

## Credits

- All illustration is generated in code (`src/lib/botanic`); no third-party images

## Develop

```bash
npm install
npm run dev
```
