# emox — reverse-design extract

> Источник: 5 скриншотов AI-native fashion-marketplace **e_mox** (UAE market, AED currency, Dubai delivery), которые Сергей предоставил 2026-05-14.
> Это **выбранное визуальное направление** для proshop_mern. Все decisions D1 / D5 / D6 / D8 закрываются на основе этого extract'а.

---

## 5 screenshots — что видим

| # | Контекст | Ключевые паттерны |
|---|----------|-------------------|
| 1 | Tablet shot, full search results + AI drawer open | Search-as-primary, animated gradient search border, brand strip, product grid, right-side AI assistant с conversation + Generate-images CTA + suggestion chips |
| 2 | Closeup split: results + AI drawer mid-conversation | "Generating AI images" status, 2×2 AI-generated jacket grid, voice mic input |
| 3 | Product Detail Page (PDP) | Full header w/ search + nav + location, breadcrumb, 50/50 image+details, size selector pills, BNPL row (tabby/tamara), big primary CTA, Protection Plan card, Shipping/Pickup tiles, seller info |
| 4 | Same as #1 but on iridescent gradient background — shows the brand vibe at extreme | "Aurora" background — pastel rainbow gradient mood |
| 5 | Closeup right panel | Chat history + Generate images card detail + Ask anything bottom input |

---

## Visual direction — named

**Aurora-commerce** — clean white surface + saturated royal blue as functional primary + iridescent pastel gradient as AI-signature accent.

It's NOT:
- Minimal-tech (too sterile).
- Luxury (no serif, no warmth).
- Brutalist (too soft, too rounded).

It IS:
- Friendly-modern consumer e-commerce with **AI as the visual hero**.
- Light-first (dark mode in screenshots — only as frame backdrop for the mockup, not actual UI dark theme).
- Iridescent / aurora / nacre accent — defines brand identity. The gradient is **the** signature element.

Sister archetypes: Klarna 2025 redesign, modern Amazon/Wayfair AI search experiments, Pinterest discovery, Shopify Magic.

---

## Decisions closed

| D# | Decision | Closed at |
|----|----------|-----------|
| **D1** Visual direction | aurora-commerce (clean white + royal blue + iridescent AI accent) | ✅ this extract |
| **D5** AI features | (c) full conversational shopping assistant + AI image generation | ✅ this extract — AI drawer is core, not optional |
| **D6** Display font | Plus Jakarta Sans (primary) / Manrope (fallback) — both clean grotesques близкие к emox visual | ✅ this extract |
| **D8** Motion | CSS-only + 1 custom: animated iridescent gradient border на active elements (signature) | ✅ this extract |
| **D3** Dark mode | light-first; dark mode = backlog (V2) | ✅ this extract (emox shipped light-only) |
| D2 | Tailwind 4 + shadcn/ui | still default; nothing in emox contradicts |
| D4 | Mobile-first | still default; emox is tablet-optimised but mobile-aware |
| D7 | In-place migration | still default |

---

## Color palette — extracted

### Primary brand color

**Royal blue** — vibrant, saturated, but not neon. Used as: stars, links, primary buttons, "YM" brand tag, "Best Deals" tint sibling, small circular search submit, selected size border, action confirmations.

```
--primary:        #1F4FCF        oklch(0.51 0.20 264)
--primary-hover:  #1842B8        oklch(0.46 0.20 264)
--primary-active: #133198        oklch(0.40 0.21 264)
--primary-fg:     #FFFFFF
```

Можно слегка ярче (более insta-blue): emox primary close to `#185BE0`. Оба ок.

### Surfaces

```
--background:      #FFFFFF        page bg, pure white (with subtle tint optional)
--card:            #F1F4F8        product image card bg (cool-gray, slight blue tint) — oklch(0.96 0.005 240)
--card-alt:        #E8ECF2        elevated/hover card bg
--surface-tinted:  #F5F7FA        chip / filter / brand-strip card bg
```

**Note:** emox использует разницу между чистым `#FFFFFF` (page) и `#F1F4F8` (product card image area) как **визуальный signal** — изображение продукта помещается в slightly tinted box, что 1) даёт breathing room, 2) поднимает product photo как primary content на белом page.

### Text

```
--foreground:      #0A1020        primary text — near-black with slight cool/blue undertone
--foreground-2:    #1F2937        h2/h3 body
--muted:           #6B7280        secondary, meta, AED currency label
--muted-2:         #9CA3AF        disabled, hint
```

### Borders & dividers

```
--border:          #E5E7EB        soft hairline, 1px
--border-subtle:   #F1F4F8        барьер между card и card на одинаковом bg
```

### Semantic states

```
--success:         #10B981        emerald — checkmarks, "Free", available
--destructive:     #EF4444        red — "Live" dot, errors
--warning:         #F59E0B        amber
--info:            #3B82F6        info badges
```

### Iridescent accent (the signature)

```
--aurora-gradient:
  linear-gradient(
    90deg,
    #FF9FCB 0%,
    #C5A9FF 25%,
    #8FC8FF 50%,
    #B5F0C8 75%,
    #FFD78F 100%
  );
```

Пастельные тона, soft saturation, full hue rotation. Использовать только для:
- Search bar border (always-on animated).
- "Ask anything…" AI input border (always-on animated).
- Selected state borders (thumbnail, shipping option).
- "Ai" text/logo (gradient text via `background-clip: text`).
- Sparkle ✨ icon fill (gradient).

**НЕ использовать** для: backgrounds full-section, buttons, large surfaces — гарантированно превратится в AI-slop.

### Partner / tertiary colors (BNPL pills)

```
--brand-tabby:     #7AFCA0        mint green
--brand-tabby-fg:  #0F1729        dark text
--brand-tamara:    #FFB4A2        peach
--brand-tamara-fg: #0F1729
```

Каждый партнёр приходит со своим цветом — это external brand assets, не наши tokens. Здесь только для reference, что в системе есть pill-slot для partner BNPL.

---

## Typography — extracted

### Шрифты

Heading + body looks like **Plus Jakarta Sans** или very close **Manrope** / **DM Sans**. Все три — grotesque humanist, slightly rounded, modern feel. emox wordmark «e_mox» — кастомный (lowercase + special interpunct symbol между `e` и `mox` — стилизованный underscore с двумя точками).

**Recommendation:**

```
--font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-body:    'Plus Jakarta Sans', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'IBM Plex Mono', monospace;
```

Одно семейство покрывает display + body (упрощение, fewer font files). Альтернатива: Plus Jakarta Sans (display) + Manrope (body) — но избыточно.

### Шкала (наблюдения по emox)

```
display:     56px   weight 800   tracking -0.025em   /  hero (если будут)
h1:          32px   weight 700   tracking -0.02em    /  PDP title "Women's Cropped Denim Jacket"
h2:          24px   weight 700   tracking -0.015em   /  section headers "Store" / "Result"
h3:          18px   weight 600   tracking -0.01em    /  card titles
body-lg:     16px   weight 400   line-height 1.6     /  product name in cards
body:        15px   weight 400   line-height 1.6     /  main paragraphs
body-sm:     14px   weight 500   line-height 1.5     /  filter chip labels, sub-info
caption:     12px   weight 500   tracking +0.01em    /  count "(2.6k)", meta
price:       20px   weight 700   tracking -0.01em    /  "300 AED", "402.32"
price-lg:    24px   weight 700   tracking -0.015em   /  PDP price
currency:    11px   weight 500   tracking +0.04em    /  "AED" superscript label, uppercase
```

**Цены — особый паттерн:** число bold large, currency-suffix («AED») — small uppercase superscript справа. Не inline same-size. Это даёт data-density без визуального шума.

---

## Spacing — extracted

8px grid, очень generous для product cards:

```
4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px
```

Конкретные numbers:

```
Page padding-x:           48px (desktop), 16px (mobile)
Section gap (vertical):   32px between "Store" / "Result" sections
Card padding:             16-20px (product card content area)
Product image padding:    16px around image inside the tinted card
Filter chip padding:      8px × 16px
Filter chip gap:          8-12px
Brand card padding:       16px / 20px (image 64×64 left + name+stars right)
Primary CTA padding:      18px × 32px (BIG, generous — Add to cart)
Suggestion chip padding:  8px × 16px
AI drawer width:          ~32% of screen on tablet/desktop
```

---

## Border radius — extracted

```
--radius-sm:    6px        product image inside card (slight)
--radius-md:    12px       cards (product, brand, protection, shipping/pickup tiles)
--radius-lg:    16px       big content cards (AI panel sections)
--radius-pill:  9999px     buttons (Add to cart), filter chips, suggestion chips, search bar
--radius-xs:    4px        small badges, "size" pills (XS S M L)
```

**Observation:** size selector pills (XS / S / M / L / XL / 2XL) имеют **square** radius ~4-6px — намеренно отличаются от chip pills (full radius). Это semantic differentiation: chips = filters, square boxes = mutually exclusive options.

---

## Elevation / shadows — extracted

emox **почти полностью** flat — depth достигается:
1. Light gray product card surface (`#F1F4F8`) on white (`#FFFFFF`) page → 2-level elevation **без shadows**.
2. AI drawer слегка отделена от main content через **тонкую vertical border** + small radius на углах + slight bg shift (`#FAFBFC` maybe).
3. **Animated gradient border** служит focus/active indicator вместо shadow ring.

Exception shadows (soft, used sparingly):
- Brand-strip cards могут иметь `0 1px 3px rgba(15, 23, 42, 0.04)` — едва заметно.
- AI drawer over content имеет `−4px 0 24px rgba(15, 23, 42, 0.06)` left-side soft shadow.
- Floating elements (dropdown menus, tooltips) — `0 8px 24px rgba(15, 23, 42, 0.08)`.

---

## Signature element — animated iridescent gradient border

Это **defining visual** для всего бренда. Документируется отдельно в [`../signature-elements.md`](../signature-elements.md).

Кратко:
- 2-3px gradient stroke, soft pastel rainbow rotation.
- Animated (slow, 6-8s loop) — background-position drift.
- Applied to: search input, AI prompt input, selected thumbnail, selected shipping option.
- Static variant (no animation) — для inactive/idle states, чтобы дать «AI inside» signal без attention demand.

Implementation pattern:

```css
.aurora-border {
  position: relative;
  border-radius: var(--radius-pill);
  background: var(--background);
  padding: 2px;  /* gives space for gradient ring */
}

.aurora-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: var(--aurora-gradient);
  background-size: 300% 300%;
  animation: aurora-drift 8s ease-in-out infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
}

@keyframes aurora-drift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .aurora-border::before { animation: none; }
}
```

---

## Iconography — extracted

| Icon | Where | Style |
|------|-------|-------|
| ✨ Sparkle (4-point burst, slightly off-center) | Search prefix, AI message marker, "Ask anything" prefix | Custom SVG, **gradient fill** when active, monochrome when inactive |
| Heart outline | Product card top-right (wishlist) | Lucide-style, 1.5px stroke |
| Mic outline (circled) | AI input bottom-right (voice) | Lucide-style |
| Shopping cart outline | Header | Lucide-style |
| Share / send (arrow up out of box) | PDP image top-right | Lucide-style |
| Location pin | "Delivering to Dubai" | Lucide-style |
| Shield (with check) | "Add Protection Plan" card | Lucide-style |
| Truck | "Shipping" / "Free Shipping" | Lucide-style |
| Box / package | "Pickup" tile | Lucide-style |
| Star filled | Rating displays | Lucide-style, brand blue |
| Compare (double arrow) | PDP "Compare" link | Custom |
| Gift box | "Best Deals" | Lucide-style, purple variant |
| × (close) | AI drawer dismiss, search clear | Lucide-style |
| Chevron-down | Filter dropdowns ("Category ▾"), country selector | Lucide-style |
| > Chevron-right | "View All >" links, breadcrumb separators | Lucide-style |

**Right hand glyph: SPARKLE.** This is the AI-affordance indicator. Anywhere you see ✨ — it signals: «this entry point connects to AI». Используется триадно:
- Inside search bar prefix → search is AI-augmented (semantic).
- Inside AI prompt input → composer is AI.
- AI assistant message prefix → this bubble is from AI.

---

## Layout patterns — extracted

### Header

```
[Logo: e_mox] [Search bar w/ aurora border ✨ ...........] [📍 Delivering to Dubai] [🇦🇪 AE ▾] [🛒 Cart] [👤 Sign In]
```

Sub-nav (PDP only, image 3):

```
[All Categories ▾] Electronics  Fashion  Women's  Kids' Fashion  Healthy & Beauty  Pharmacy  Groceries  Luxury Item   [🎁 Best Deals]   [emox Live ●]
```

Best Deals + emox Live — visually distinct (purple gradient / red live dot).

### Search results page (images 1, 2, 4, 5)

```
┌─────────────────────────────────────────┬──────────────────────┐
│ [Filter chips: Category Rating Gender Size Color Price Sort by] │ AI Panel        │
│                                                                 │ (closable ×)    │
│ Store ───────────────── View All →                              │                 │
│ [brand-card][brand-card][brand-card][brand-card] [→]            │ User msg ▶      │
│                                                                 │ ✨ AI response   │
│ Result ──────────────── View All →                              │                 │
│ [PC][PC][PC][PC][PC]                                            │ [Generate img]  │
│ [PC][PC][PC][PC][PC]                                            │ ◇suggestion◇    │
│                                                                 │                 │
│                                                                 │ [✨ Ask...] [🎤] │
└─────────────────────────────────────────┴──────────────────────┘
```

### PDP (image 3)

```
[Header with full nav]
[Breadcrumb: Home / Fashion / Winter cloth / ProductName]

┌────────────────────────────────────┬─────────────────────────────────┐
│ [Image: tinted card, ❤︎ ⤴ icons]  │ [YM] (brand link, small)        │
│                                    │ # Women's Cropped Denim Jacket  │
│                                    │ ★ 4.9 (2.6k) | ⇆ Compare        │
│                                    │                                  │
│                                    │ Select Size                      │
│                                    │ [XS][S][M][L][XL][2XL]           │
│                                    │                                  │
│                                    │ From  402.32 AED                 │
│                                    │ As low as $38/mo with            │
│                                    │ [tabby] [tamara]   Learn how     │
│                                    │                                  │
│                                    │ ┌──────────────────────────┐    │
│                                    │ │      Add to cart         │    │
│                                    │ └──────────────────────────┘    │
│                                    │                                  │
│                                    │ ┌─ 🛡 Add Protection Plan ──┐  │
│                                    │ │ Only one option…             │
│                                    │ │ ☐ 2-Year plan-668 ☐ 3-Year… │
│                                    │ └────────────────────────────┘  │
│                                    │                                  │
│                                    │ How you'll get this item:       │
│                                    │ ┌─🚚 Shipping─┐ ┌─📦 Pickup─┐  │
│                                    │ │ Arrives Feb │ │ Not avail.  │  │
│ [thumb][thumb][thumb][thumb][thumb]│ │ Free  [aurora border]      │  │
│                                    │ └─────────────┘ └────────────┘  │
│                                    │ Sacramento, 96898 Change         │
│                                    │ Arrives by Fri, Feb 20 More opt. │
│                                    │ Sold by Paisley & Gray ★★★★★    │
│                                    │ 🚚 Free Shipping Details         │
│                                    │ ↺ Free 30-day returns Details    │
└────────────────────────────────────┴─────────────────────────────────┘
```

---

## New components introduced by emox

(не были в proshop_mern legacy, нужно создать)

1. **AuroraBorder** — wrapper-component с animated gradient border. Variants: `static`, `animated`, `subtle`. Used as: SearchInput, AIPromptInput, selected-tile-wrapper.
2. **AIDrawer** — right-side closable panel. Composed of: header (× close), conversation thread, contextual CTA card (Generate images), suggestion chips, prompt input.
3. **AIMessage** — chat bubble. Two variants: user (right, gray pill) и assistant (left, no bubble, ✨ prefix, emoji-friendly).
4. **SuggestionChip** — one-tap fill-input chips below CTA cards.
5. **GenerateImagesCard** — promo card with 3D illustration thumbnail + bold copy + CTA + 3 suggestion chips below.
6. **BrandStrip** — horizontal scrollable row of brand cards (image + name + rating + Visit shop link).
7. **BrandCard** — single brand card.
8. **FilterChipBar** — horizontal scrollable row of dropdown-pill filters (Category ▾, Rating ▾, etc).
9. **SizeSelector** — row of square radius pills XS/S/M/L/XL/2XL (mutually exclusive).
10. **BNPLRow** — "As low as $X/mo with [partner-pill] [partner-pill] Learn how".
11. **ProtectionPlanCard** — upsell card with shield icon, 2-3 plan options as toggleable pills.
12. **DeliveryOptionTile** — Shipping / Pickup tile pair (selected has aurora border). Each tile: icon + label + small status text + selected-state.
13. **SellerInfoBlock** — "Sold and shipped by [name]" + star rating + review count link.
14. **PriceLockup** — number bold + currency superscript uppercase.
15. **PromoBadge** — "Best Deals" gift-icon link + "emox Live" red-dot link, both for header sub-nav.
16. **AIIdentityBadge** — gradient "Ai" text-mark, also serves as panel header.

---

## Updated component-priority (P0 → P3)

After emox extract, screen priorities shift slightly:

### P0 — week 1 (storefront + AI core)
- Header (with aurora-border SearchInput, location indicator, country selector).
- Footer (cleaner, multi-link, trust signals).
- HomeScreen + FilterChipBar + BrandStrip + ProductCard grid + Pagination.
- ProductCard (with heart wishlist, tinted bg, brand blue stars, PriceLockup).
- AIDrawer (basic shell + conversation thread + prompt input). Even if backend AI не готов — мокаем UI.

### P0+ (recommended)
- ProductScreen (PDP) — самый сложный, complete redesign with breadcrumb, size selector, BNPL row, protection plan card, delivery option tiles, seller block.
- CartScreen — cart drawer pattern aligned с AIDrawer аналитично (right-side, closable).

### P1
- Auth (Login/Register/Profile).
- Checkout flow (Shipping → Payment → PlaceOrder → Order).

### P2 / P3
- Admin screens.

---

## Tone & microcopy — extracted

- **AI assistant** говорит дружелюбно, использует emojis sparingly (🎨✨) — но не overdoes.
- AI sentences начинаются с **«Absolutely!»** / **«Sure»** / **«Of course»** — affirmation framing.
- Suggestion chips короткие, lowercase first word + capitalized noun: «denim Jacket», «Purple Jacket», «leather Jacket».
- Trust copy concrete: «Free 30-day returns», «20 seller reviews».
- BNPL row: «As low as $38/mo with [tabby] [tamara] Learn how».
- Voice input prompt: «Ask anything…».
- Empty / loading / generating states: «Generating AI images» (named status, not generic spinner).

---

## What this extract changes downstream

Documents that get concrete values из этого extract:

- ✅ [`../tokens.md`](../tokens.md) → новый «Preset D — emox aurora-commerce» с конкретными hex/spacing/radius.
- ✅ [`../signature-elements.md`](../signature-elements.md) — NEW file documenting aurora-border + sparkle + iridescent text.
- ✅ [`../screen-inventory.md`](../screen-inventory.md) → 16 новых компонентов добавлены в roadmap.
- ✅ [`../ai-features-roadmap.md`](../ai-features-roadmap.md) → AI assistant promoted from optional to **core P0**, не backlog.
- ✅ [`../visual-references.md`](../visual-references.md) → таблица заполнена этими 5 скринами.
- ✅ [`../../Design.md`](../../Design.md) → D1 / D5 / D6 / D8 closed, signature element callout added.

---

## Cross-refs

- Главный navigator: [`../../Design.md`](../../Design.md)
- Tokens: [`../tokens.md`](../tokens.md)
- Signature: [`../signature-elements.md`](../signature-elements.md)
- AI features: [`../ai-features-roadmap.md`](../ai-features-roadmap.md)
- Screen inventory: [`../screen-inventory.md`](../screen-inventory.md)
