# How we build websites (read this first)

This is the house workflow for every site we build, Manolia included.

## 1. Start from the client's own Instagram
- Study their feed before designing anything: colours, flowers/products, wrapping, photo style, mood, logo, captions.
- Write down the vibe in a few words and keep the design faithful to it.
- Manolia: https://www.instagram.com/manoliathefloralboutique/ (Instagram is blocked from the cloud sandbox;
  if it can't be fetched, ask for screenshots of the feed and logo rather than guessing).

## 2. Find the best reference in the category
- Look for the most animated, illustrative, "sexy" sites in the same category in Europe and the US
  (Awwwards / Siteinspire / Godly / CSS Design Awards winners).
- Pick the single best one and model the style on it: type pairing, palette, layout, motion.
  Borrow the design moves, never the brand's name, copy, logo or assets.

## 3. Apply the "10 invisible details" guide (Samana Studio, Field Notes N°1)
1. Nothing moves in a straight line — one ease everywhere: `cubic-bezier(.16,1,.3,1)` / GSAP `expo.out`.
2. The hero gets 40% of the budget — the first 3 seconds are a film's opening shot; text arrives in sequence.
3. The scroll is choreographed — Lenis + GSAP ScrollTrigger, parallax, pinned scenes.
4. Empty space does the talking — generous section padding, say less.
5. It's a space, not a page — depth (layers at different speeds, pointer tilt, or WebGL).
6. It responds to you — micro-interactions: custom cursor, magnetic buttons, hover reveals (mouse only).
7. Typography has a wardrobe — two or three faces with discipline; huge then tiny, never medium everywhere.
8. Darkness is a positioning choice — dark grounds with one off-centre glow, chosen on purpose.
9. Fast because it's heavy — transform/opacity only, 60fps on a mid-range phone, honour reduced motion.
10. Every section opens a question — the page reads as one argument in chapters, ending with a reason to contact.

## 4. Quality bar
- It must not look AI-made: no generic gradients, clip-art, stock layouts or "medium everything" type.
- Screenshot desktop (1440×900) and phone (390×844) and look at them before committing.
- Run `npx tsc --noEmit`, `npm run lint` and `npx next build` before pushing.
- Small, descriptive commits; keep the README current.

## Manolia specifics
- Stack: Next.js 15 · React 19 · Tailwind 4 · GSAP + ScrollTrigger · Lenis · Framer Motion · Zustand.
- Type: Instrument Serif (display) · Geist (body) · Geist Mono (labels).
- Palette: night forest `#13241a`, paper `#f1ece2`, ink line `#efe6d2`, blush `#f0b9ae`, clay `#b4584d`.
- All art is generated code (`src/lib/botanic`): the hero bouquet, the flowers along the scroll-grown root,
  the shop plates and the butterflies. Keep new illustration in the same engraved, hand-coloured hand.
- Orders go out as a WhatsApp message (`src/lib/site.ts`). Flower facts live in `src/lib/garden.ts`.
