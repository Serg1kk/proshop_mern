# Signature Elements — defining brand visuals

> Большинство дизайн-систем имеет **один-два signature element**, которые узнаваемы независимо от контекста и являются brand-сигналом.
>
> Для proshop_mern (aurora-commerce direction, см. [`references/emox-extract.md`](references/emox-extract.md)) — два signature element:
>
> 1. **Aurora border** — animated iridescent gradient stroke на active/interactive inputs.
> 2. **Sparkle ✨ AI affordance** — 4-point burst icon, gradient-filled when active, monochrome when idle. Универсальный indicator «this entry point connects to AI».
>
> Третий, secondary — **AED-style price lockup** (number bold + currency superscript).

---

## 1. Aurora border

### Purpose

Visual signature всей системы. Indicates:
- **Always-on active:** search bar, AI prompt input — браузер scans page и сразу видит «this is AI search / AI input», не keyword box.
- **Selected state:** selected product thumbnail, selected delivery option — заменяет thick blue outline или drop shadow ring.

### Visual spec

```
Border width:    2px
Border radius:   inherits from parent (pill / lg card / md card)
Gradient hues:   5 stops — pink → purple → blue → mint → amber
Saturation:      pastel, soft (NOT neon)
Animation:       8s ease-in-out, background-position drift left ↔ right
Reduced motion:  static (no animation, gradient still visible)
```

Color stops:

```css
--aurora-stop-1: #FF9FCB;  /* pink */
--aurora-stop-2: #C5A9FF;  /* purple */
--aurora-stop-3: #8FC8FF;  /* sky-blue */
--aurora-stop-4: #B5F0C8;  /* mint */
--aurora-stop-5: #FFD78F;  /* amber */

--aurora-gradient: linear-gradient(
  90deg,
  var(--aurora-stop-1) 0%,
  var(--aurora-stop-2) 25%,
  var(--aurora-stop-3) 50%,
  var(--aurora-stop-4) 75%,
  var(--aurora-stop-5) 100%
);
```

### Implementation — CSS-only

```css
.aurora-border {
  position: relative;
  border-radius: var(--radius-pill);
  background-color: var(--background);
  z-index: 0;
}

.aurora-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: var(--aurora-gradient);
  background-size: 300% 300%;
  animation: aurora-drift 8s ease-in-out infinite;

  /* Inverse mask trick — ring only, not fill */
  -webkit-mask: linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
  z-index: -1;
}

@keyframes aurora-drift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
```

### Variants

| Variant | Class | Use case |
|---------|-------|----------|
| Animated (default) | `.aurora-border` | Always-on AI inputs (search, AI prompt) |
| Static | `.aurora-border.--static` | Selected non-AI elements (thumbnail, delivery tile) — no animation, gradient frozen |
| Subtle | `.aurora-border.--subtle` | Idle states — single hue + low chroma, animated very slowly (~20s) — hints at AI без attention demand |

### Usage examples

```jsx
// AI search bar
<div className="aurora-border rounded-pill">
  <Sparkle className="prefix" />
  <input type="search" placeholder="Search for any product or brand" />
  <button aria-label="Clear search">×</button>
</div>

// Selected thumbnail
<button className={cn('thumbnail', isSelected && 'aurora-border --static')}>
  <img src={...} alt="..." />
</button>
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .aurora-border::before {
    animation: none;
    /* gradient still visible — just frozen at mid-position */
    background-position: 50% 50%;
  }
}
```

Critical: НЕ убираем gradient полностью при reduced-motion. Юзер хочет less motion, не less identity. Just freeze the animation.

### Anti-patterns

- ❌ Aurora gradient как **background fill** на crowd элементах — outside search/AI/selected states. Reads as decorative, AI-slop.
- ❌ Aurora gradient на text fill (кроме «Ai» logo wordmark, см. ниже) — illegible.
- ❌ Saturated / neon variant — должно остаться soft pastel.
- ❌ Border width > 3px — становится heavy, теряет refinement.
- ❌ Aurora на error / destructive state — конфликтует с red border semantic.

### A11y considerations

- Animated border не должен мешать read-ability content внутри.
- Focus ring `--ring` (royal blue) **дополняет** aurora, не заменяет: на focus-visible — additional 2px solid royal-blue outline, offset 4px, **поверх** aurora.
- Аналог animation runtime: max 8s loop, easing ease-in-out → no jarring transitions.

---

## 2. Sparkle ✨ AI affordance

### Purpose

Universal indicator: «this entry point talks to AI». Wherever юзер видит ✨ — он знает, что это AI-augmented (search, generation, conversation, suggestion).

### Visual spec

4-point burst, slightly asymmetric (small star at top-right). Не уравновешенная snowflake — namely AI-look, not generic decoration.

```
Glyph size:       16px / 20px / 24px / 32px (4 standard sizes)
Stroke / fill:    Solid fill (when gradient applied) or 1.5px stroke
Color (active):   var(--aurora-gradient) — gradient fill via inline SVG
Color (idle):     var(--muted) или var(--foreground)
Color (button-prefix on primary): white
```

### SVG (canonical, для копи-паста)

```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M10 1.5l1.83 5.17L17 8.5l-5.17 1.83L10 15.5l-1.83-5.17L3 8.5l5.17-1.83L10 1.5z" fill="url(#sparkle-gradient)"/>
  <path d="M16 14l0.6 1.65L18.25 16l-1.65 0.6L16 18.25l-0.6-1.65L13.75 16l1.65-0.6L16 14z" fill="url(#sparkle-gradient)"/>
  <defs>
    <linearGradient id="sparkle-gradient" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF9FCB"/>
      <stop offset="0.5" stop-color="#8FC8FF"/>
      <stop offset="1" stop-color="#FFD78F"/>
    </linearGradient>
  </defs>
</svg>
```

### Usage matrix

| Context | Sparkle treatment |
|---------|-------------------|
| Search input prefix (aurora border on) | Gradient-filled, animated subtle pulse on focus |
| AI prompt input prefix | Gradient-filled, animated |
| AI message bubble prefix (chat) | Gradient-filled, static (one-time render) |
| AI suggestion button | Gradient-filled, smaller (16px) |
| Primary AI CTA «Generate images» | White (on blue button bg), no gradient |
| Header tooltip («Try AI search») | Gradient-filled |
| Loading state «Thinking…» / «Generating…» | Optional: pulse with `--aurora-stop-3` solid color |

### Anti-patterns

- ❌ Sparkle на non-AI entry point (regular Save button, regular link) → diluted meaning.
- ❌ Multiple sparkles в одной строке → noise.
- ❌ Animated sparkle (rotation, scale loop) — лишний motion. Только subtle pulse on focus.

---

## 3. AI gradient text — «Ai» wordmark

For AI panel header and similar AI-identity moments.

```css
.ai-text {
  background: var(--aurora-gradient);
  background-size: 200% 200%;
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
  animation: aurora-drift 12s ease-in-out infinite;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .ai-text { animation: none; }
}
```

Use sparingly: 1-2 occurrences per screen max (panel header, маркетинговый CTA). НЕ для body copy.

---

## 4. Price lockup (secondary signature)

emox-style price display — bold number + small uppercase currency suffix superscript.

### Visual spec

```
Number weight:        700 bold
Number size:          16-24px (context-dependent)
Number tracking:      -0.01em
Currency label:       9-11px, uppercase, weight 500, tracking +0.04em
Currency baseline:    superscript (vertical-align baseline, offset top)
Currency color:       --muted (no shouting)
Spacing:              2px gap between number and currency (no comma, no space)
```

### Implementation

```jsx
<span className="price-lockup">
  <span className="price-num">300</span>
  <sup className="price-currency">AED</sup>
</span>
```

```css
.price-lockup {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}
.price-num {
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.01em;
  color: var(--foreground);
}
.price-currency {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  vertical-align: top;
  margin-top: 0.15em;
}
```

### Variants

- `.price-lockup.--lg` — 24-28px number для PDP price.
- `.price-lockup.--strike` — number имеет line-through, для original price before discount.
- `.price-lockup.--from` — "From" prefix small uppercase muted: «From 402.32 AED».

---

## 5. AED currency formatting note

Even выходим за UAE — оставляем pattern для любой currency. EUR, USD, RUB — все читаются как small uppercase suffix.

```jsx
<PriceLockup amount={300} currency="AED" />
<PriceLockup amount={84.50} currency="USD" />
<PriceLockup amount={1200} currency="EUR" />
```

Inside, lib читает `Intl.NumberFormat` для locale-aware decimal/separator, но renders как наш custom lockup, не дефолтный browser-look.

---

## Signature element checklist (для каждого PR)

- [ ] Search inputs / AI inputs имеют aurora-border (animated).
- [ ] Selected non-AI states (thumbnails, delivery tiles) имеют aurora-border (static).
- [ ] Все AI entry points маркированы sparkle ✨.
- [ ] Sparkle gradient consistent (не разные палитры в разных местах).
- [ ] Prices используют PriceLockup, не raw concat strings.
- [ ] Reduced motion gates применены ко всем animated gradients.
- [ ] Focus rings (royal blue) дополняют, не заменяют aurora.

---

## Cross-refs

- emox extract (origin): [`references/emox-extract.md`](references/emox-extract.md)
- Tokens (aurora gradient + sparkle SVG): [`tokens.md#signature`](tokens.md#signature)
- Motion (gradient drift animation): [`motion.md`](motion.md)
- A11y (reduced motion, focus rings): [`accessibility.md`](accessibility.md)
- Main: [`../Design.md`](../Design.md)
