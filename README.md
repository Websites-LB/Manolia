# Manolia — The Floral Boutique

Website for Manolia, a floral boutique in Jbeil (Byblos), Lebanon: floral design, weddings and events.

- **Home**: a painted bouquet draws itself stem by stem in front of the name (hero). A root pushes out of its
  cut stems and runs down the whole page as you scroll, and every flower we work with (peony, garden rose,
  anemone, ranunculus, hydrangea, tulip) sprouts from it with its Latin name, season, meaning, colours and the
  bouquets it is in. Weddings & events, how to order and the visit grow off the same root. Butterflies drift
  over everything and shy away from the cursor.
- **Shop** (`/shop`): every bouquet, box and vase is a painted plate in its own colours (no stock photos) that
  leans toward the pointer and glows.
- **Compose your own** (`/shop/build`): pick stems, palette, greenery and wrap; the bouquet redraws on every
  choice and the price follows. The recipe goes into the bag as composed.
- **Florist's choice** (`/shop#florist`): for whoever does not know what to send. Occasion, colours, a few words
  about the person, a budget, a name and a phone number. Sending it opens a conversation (`/request/…`): the
  florist writes back, can send photos and a proposal with a price; the customer says yes or asks for a change,
  and pays only then. The agreed proposal goes to the checkout at the agreed price.
- **Voice note**: at the checkout the sender can record up to 30 seconds. The board shows a QR code to print on
  the card; scanning it (`/note/…`) plays the message.
- **Share a bouquet**: the builder's "Share it" copies a link (`/shop/build?b=…`) that reopens the same bouquet.
- **Checkout** (`/checkout`) → payment on the provider's own page → **tracking** (`/order/…`): the customer
  watches the order go from received to delivered.
- **Atelier** (`/atelier`): the boutique's bench. Orders: paid orders arrive by themselves with a bell and move
  one step per button. Requests & chat: every florist's-choice conversation, with replies, photos and proposals.
- **Footer**: a flower bed at dusk, seen from the side, with the facts set into the soil.

## Stack

Next.js 15 · React 19 · Tailwind CSS 4 · GSAP + ScrollTrigger · Lenis · Radix UI · Framer Motion · Zustand ·
Number Flow (prices that roll) · Sonner (toasts) · Zod (server validation) · qrcode (voice-note codes)

Type: Instrument Serif only, the face the name is set in. Display, reading text and labels differ by size,
case and italics, never by font.

## The painted botanicals (`src/lib/botanic`)

Nothing is a photograph: seeded code draws peony, roses, ranunculus, anemone, hydrangea, tulip, buds, leaves,
eucalyptus, gypsophila and a silk tie. Each petal and leaf is a filled shape whose pigment deepens toward its
base and pales toward the edge (`color.ts`, `parts.ts`), with a light rim, darker veins and green stems that
have real thickness. `paint.ts` paints them on a canvas the way light would: every shape first casts a soft
shadow on what lies under it, then takes its gradient, the light of the scene (from the upper left) and a
translucent edge. There are no outlines. A plate paints itself back to front, a few petals per frame.

- `bouquet.ts` the hero bouquet · `specimen.ts` single plants and shop plates · `custom.ts` the composed bouquet
- `roots.ts` the taproot, its tapering side roots and root hairs, threaded through each flower after layout
- `meadow.ts` the footer's flower bed, bulbs and stones, generated at the page's pixel width

## Photographs (`public/art`, `src/lib/photos.ts`)

Where a photograph exists it replaces the painted version: single stems along the root, the hero bouquet,
shop pieces, and flower heads. The heads are cut-out photos of white blooms; the painter multiplies them by
a colour, so the builder composes real flowers in any palette. `photos.ts` lists which files exist; anything
not listed stays painted, so the site is whole with any subset.

The current photographs are generated stand-ins (Higgsfield, `z_image`), cut off their backdrops with
`.claude/gen/prep.py`. Replace them with Manolia's own pictures by keeping the same names and sizes.

## Orders and payment

No order leaves the site as a chat message. The checkout posts to `/api/orders`; the server re-prices every
line (`src/lib/server/orders.ts`), saves the order and sends the customer to the payment provider's page.
When the payment is confirmed the order appears on `/atelier` and the boutique is notified.

| What | Where | Needs |
| --- | --- | --- |
| Whish | `src/lib/server/payments.ts` (Whish Pay collect API) | `WHISH_CHANNEL`, `WHISH_SECRET`, `WHISH_WEBSITE_URL`; `WHISH_API_BASE` (defaults to the sandbox; production is `https://whish.money/itel-service/api`) |
| Card | not wired yet: needs a merchant account with a card gateway | (the gateway's keys) |
| Order board | `/atelier` | `ATELIER_KEY` (a passphrase; without it the board is open locally and shut in production) |
| Extra pings to the boutique | `src/lib/server/notify.ts` | WhatsApp Business: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TO`, `WHATSAPP_TEMPLATE` · Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` · Email: `RESEND_API_KEY`, `ORDER_EMAIL_TO`, `ORDER_EMAIL_FROM` |
| Links handed to providers | | `SITE_URL` (the public address, e.g. `https://manolia.example`) |

- **Test mode**: with no credentials, local development uses a built-in test gateway (`/pay/test/…`) that moves
  no money, so the whole flow can be walked through. In production an unconfigured method is off
  (`PAYMENTS_TEST_MODE=1` forces the test gateway on, for a staging site).
- **Storage**: orders and requests are JSON files under `.data/` (`src/lib/server/store.ts`), photos and voice
  notes are files under `.data/uploads`. That is fine on a laptop; a serverless host has no disk, so a database
  and object storage must replace them before launch.
- **Security**: strict response headers and a content-security policy (`next.config.ts`); every price is
  re-computed on the server; uploads are checked by their first bytes, size-capped and renamed; public
  endpoints are rate-limited per address in memory (`src/lib/server/guard.ts`; needs a shared store behind
  several instances); order, request and note pages are unlisted links with unguessable ids.
- **Not verified yet**: the Whish calls follow the documented collect API but have not been run against a real
  merchant account, and the notification channels have not been run with real credentials.
- **Placeholders to confirm with Manolia**: prices and florist's-choice budgets (`src/lib/products.ts`, `src/lib/custom.ts`), delivery zones,
  fees and time slots (`src/lib/site.ts`).

See `CLAUDE.md` for how we work.

## Credits

- All illustration is generated in code (`src/lib/botanic`); no third-party images

## Develop

```bash
npm install
npm run dev
```
