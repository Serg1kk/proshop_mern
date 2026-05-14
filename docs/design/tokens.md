# Design Tokens — детальные таблицы

> Раскрытие §1-5 из [`../../Design.md`](../../Design.md).
>
> **Active preset:** Preset D — aurora-commerce (emox-inspired). Закрыт 2026-05-14.
> **Источник:** [`references/emox-extract.md`](references/emox-extract.md).
>
> Остальные пресеты (A minimal-tech / B luxury-serif / C consumer-warm) — оставлены как reference, на случай pivot.

---

## Two-tier architecture

```
Primitives                Semantic                       Component (NOT used)
--------------------     ----------------------          ----------------------
--blue-500: ...          --primary: var(--blue-500)      (forbidden: --button-bg)
--gray-50:  ...          --background: var(--gray-50)
--red-600:  ...          --destructive: var(--red-600)
```

**Правило:** компоненты используют **только** semantic. Primitives живут в одном файле `tokens-primitive.css`, semantic — в `tokens-semantic.css`. Меняем primitives — обновляется весь UI.

**Component-level token tier намеренно пропускаем** (Terrazzo recommendation, Atlassian негативный пример с 37K токенами).

---

## Colors

### OKLCH-палитра (perceptually uniform)

Все цвета — в OKLCH. Lightness steps consistent across hues, что гарантирует одинаковый perceived contrast при ramp'е от 50 до 950. См. [oklch.com](https://oklch.com).

**Universal lightness ladder:**

```
L: 0.97 → 0.93 → 0.85 → 0.77 → 0.69 → 0.61 → 0.52 → 0.44 → 0.35 → 0.27 → 0.18
Step: 50    100    200    300    400    500    600    700    800    900    950
```

500-600 = base shade. 50-400 = paired с dark text. 600-950 = paired с white text.

### Palette presets по направлениям (D1)

#### ✅ Preset D — aurora-commerce (emox-inspired) — ACTIVE

> Это **выбранный** preset. Используется в Phase 0+ имплементации. Все остальные пресеты ниже — historical reference.

```css
:root {
  /* ─── PRIMITIVES ─── */

  /* Royal blue — brand primary */
  --blue-50:   oklch(0.97 0.02 264);
  --blue-100:  oklch(0.92 0.06 264);
  --blue-300:  oklch(0.75 0.16 264);
  --blue-500:  oklch(0.51 0.20 264);   /* #1F4FCF base */
  --blue-600:  oklch(0.46 0.20 264);   /* #1842B8 hover */
  --blue-700:  oklch(0.40 0.21 264);   /* #133198 active */
  --blue-900:  oklch(0.27 0.15 264);

  /* Cool-tinted neutrals (warm-white is wrong direction for aurora) */
  --gray-0:    #FFFFFF;
  --gray-25:   oklch(0.99 0.005 240);  /* #FAFBFC subtle off-white */
  --gray-50:   oklch(0.97 0.005 240);  /* #F5F7FA chip / nav bg */
  --gray-100:  oklch(0.96 0.005 240);  /* #F1F4F8 product card bg */
  --gray-200:  oklch(0.92 0.005 240);  /* #E8ECF2 hover surface */
  --gray-300:  oklch(0.89 0.005 240);  /* #E5E7EB border */
  --gray-400:  oklch(0.69 0.01 240);   /* #9CA3AF disabled */
  --gray-500:  oklch(0.54 0.01 240);   /* #6B7280 muted text */
  --gray-700:  oklch(0.28 0.01 240);   /* #1F2937 secondary text */
  --gray-900:  oklch(0.12 0.01 240);   /* #0A1020 primary text */

  /* Semantic feedback */
  --emerald-500:  oklch(0.72 0.16 162);  /* #10B981 */
  --red-500:      oklch(0.65 0.22 28);   /* #EF4444 */
  --amber-500:    oklch(0.78 0.17 75);   /* #F59E0B */

  /* ─── AURORA SIGNATURE GRADIENT ─── */
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

  /* ─── SEMANTIC TOKENS ─── */
  --background:      var(--gray-0);
  --background-alt:  var(--gray-25);
  --foreground:      var(--gray-900);
  --foreground-2:    var(--gray-700);
  --muted:           var(--gray-500);
  --muted-2:         var(--gray-400);

  --card:            var(--gray-100);    /* product-image card bg, soft cool-gray */
  --card-alt:        var(--gray-200);    /* hover / pressed surface */
  --surface-tinted:  var(--gray-50);     /* chip bg, nav bg */

  --primary:         var(--blue-500);
  --primary-hover:   var(--blue-600);
  --primary-active:  var(--blue-700);
  --primary-fg:      #FFFFFF;

  --accent:          var(--aurora-gradient);  /* used only for signature */
  --success:         var(--emerald-500);
  --destructive:     var(--red-500);
  --warning:         var(--amber-500);

  --border:          var(--gray-300);
  --border-subtle:   var(--gray-100);
  --ring:            var(--blue-500);

  /* Partner pills (BNPL) — semantic placeholder, per-partner overridden */
  --partner-tabby-bg:    #7AFCA0;
  --partner-tabby-fg:    var(--gray-900);
  --partner-tamara-bg:   #FFB4A2;
  --partner-tamara-fg:   var(--gray-900);

  /* Promo accents */
  --best-deals-tint:  oklch(0.66 0.20 312);   /* purple, used for "Best Deals" link */
  --live-dot:         var(--red-500);          /* "emox Live" pulsing red */
}
```

**Optional dark mode (backlog V2):** preserve royal-blue primary, swap surfaces.

```css
[data-theme="dark"] {
  --background:      oklch(0.14 0.012 240);  /* near-black slight cool */
  --background-alt:  oklch(0.18 0.012 240);
  --foreground:      var(--gray-25);
  --muted:           oklch(0.62 0.01 240);
  --card:            oklch(0.20 0.012 240);
  --card-alt:        oklch(0.25 0.012 240);
  --primary:         oklch(0.65 0.20 264);   /* lighter for contrast */
  --border:          oklch(0.24 0.012 240);
  /* Aurora gradient unchanged — pastel works on both modes */
}
```

**Typography for Preset D:**

```css
:root {
  --font-display: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-body:    'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', 'IBM Plex Mono', monospace;
}
```

Google Fonts import:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
```

**Radius for Preset D:**

```css
:root {
  --radius-none: 0;
  --radius-xs:   4px;     /* size pills XS S M L */
  --radius-sm:   6px;     /* small badges, image inside product card */
  --radius-md:   12px;    /* cards (product, brand, protection, delivery tile) */
  --radius-lg:   16px;    /* AI panel sections, modal */
  --radius-xl:   20px;
  --radius-pill: 9999px;  /* buttons, filter chips, suggestion chips, search bar */
}
```

**Specific component sizing for Preset D:**

```
Primary CTA height:      56px (Add to cart — generous)
Secondary button height: 40px
Filter chip height:      36-40px
Search bar height:       52-56px (incl. 2px aurora border)
Size pill width × height: 56 × 44px
Brand card height:        80-92px
Product image padding:    16px around image inside --card bg
AI drawer width:          384px (desktop), full width (mobile bottom-sheet)
```

---

#### Preset A — minimal-tech (Linear / Vercel / Stripe Atlas)

```css
:root {
  /* Primitives — dark mode first */
  --slate-50:  oklch(0.97 0.01 248);
  --slate-100: oklch(0.93 0.02 248);
  --slate-200: oklch(0.85 0.02 250);
  --slate-400: oklch(0.61 0.04 252);
  --slate-500: oklch(0.50 0.04 254);
  --slate-700: oklch(0.30 0.03 252);
  --slate-800: oklch(0.23 0.03 250);
  --slate-900: oklch(0.19 0.02 252);
  --slate-950: oklch(0.12 0.02 250);

  --indigo-500: oklch(0.55 0.22 264);
  --indigo-600: oklch(0.49 0.22 264);
  --indigo-400: oklch(0.67 0.18 264);

  --cyan-400:   oklch(0.83 0.18 197);
  --red-500:    oklch(0.65 0.22 28);
  --emerald-500: oklch(0.72 0.16 162);
  --amber-500:  oklch(0.78 0.17 75);

  /* Semantic — dark mode default */
  --background:  var(--slate-950);
  --foreground:  var(--slate-50);
  --card:        var(--slate-900);
  --card-alt:    var(--slate-800);
  --primary:     var(--indigo-500);
  --primary-fg:  #ffffff;
  --muted:       var(--slate-500);
  --accent:      var(--cyan-400);
  --destructive: var(--red-500);
  --success:     var(--emerald-500);
  --warning:     var(--amber-500);
  --border:      var(--slate-800);
  --ring:        var(--indigo-400);
}

[data-theme="light"] {
  --background:  var(--slate-50);
  --foreground:  var(--slate-950);
  --card:        #ffffff;
  --card-alt:    var(--slate-100);
  --primary:     var(--indigo-600);
  --muted:       var(--slate-400);
  --border:      var(--slate-200);
  --ring:        var(--indigo-500);
}
```

#### Preset B — luxury-serif (Loro Piana / Aesop / Bang & Olufsen)

```css
:root {
  --stone-50:  oklch(0.98 0.005 80);   /* #fafaf7 warm off-white */
  --stone-200: oklch(0.91 0.008 70);
  --stone-400: oklch(0.55 0.015 50);
  --stone-900: oklch(0.20 0.012 60);   /* #1c1917 stone-900 */

  --navy-900:  oklch(0.20 0.06 260);   /* #1a1a2e deep navy primary */
  --gold-400:  oklch(0.78 0.13 85);    /* #d4af37 antique gold accent */
  --crimson-700: oklch(0.45 0.18 25);  /* #b91c1c muted destructive */

  --background:  var(--stone-50);
  --foreground:  var(--stone-900);
  --card:        #ffffff;
  --card-alt:    oklch(0.96 0.008 70);
  --primary:     var(--navy-900);
  --primary-fg:  var(--stone-50);
  --muted:       var(--stone-400);
  --accent:      var(--gold-400);
  --destructive: var(--crimson-700);
  --border:      oklch(0.91 0.005 65); /* warm hairline */
  --ring:        var(--navy-900);
}
```

Dark mode для luxury — опционально. Если делаем — deep warm-brown `oklch(0.18 0.02 60)` как background, не cold slate.

#### Preset C — consumer-warm (Notion / Linear / Arc-style)

```css
:root {
  --warm-gray-50:  oklch(0.97 0.008 50);
  --warm-gray-900: oklch(0.20 0.01 50);
  --orange-500:    oklch(0.70 0.19 50);   /* warmer than #6366f1 indigo */
  --teal-500:      oklch(0.65 0.13 195);

  --background: var(--warm-gray-50);
  --foreground: var(--warm-gray-900);
  --primary:    var(--orange-500);
  --accent:     var(--teal-500);
  /* ... */
}
```

### Контрастные пары (WCAG 2.1 AA verified)

Для каждой semantic-комбинации фиксируем contrast ratio. Минимумы:

- `--foreground` on `--background` ≥ 4.5:1 (body text)
- `--muted` on `--background` ≥ 4.5:1 (body) или 3:1 (large text 18px+)
- `--primary-fg` on `--primary` ≥ 4.5:1 (button)
- `--ring` on `--background` ≥ 3:1 (focus indicator)
- `--destructive` text on `--background` ≥ 4.5:1

Конкретные ratios считаются после выбора preset через https://webaim.org/resources/contrastchecker/. Записываются в раздел «Verified contrast» этого файла после financial check.

### Forbidden colors (anti-slop)

- `#6366f1` / `#8b5cf6` / `#7c3aed` — AI-default indigo/violet. Используется только если `--primary` явно задан как indigo (preset A).
- Pure black `#000000` и pure white `#ffffff` — никогда. Tinted black `oklch(0.20 0.01 250)`, tinted white `oklch(0.99 0.005 80)`.
- Tailwind default palette `slate-*`/`gray-*`/`zinc-*` без кастомизации — generic AI-look indicator.

---

## Typography

### Шрифты-кандидаты (по D1)

| Direction | Display | Body | Mono | Imports |
|-----------|---------|------|------|---------|
| minimal-tech | Manrope 700 | Manrope 400 | JetBrains Mono 400 | Google Fonts |
| minimal-tech alt | Geist Sans Bold | Geist Sans Regular | Geist Mono | Vercel CDN |
| luxury-serif | Playfair Display 700 | Inter Tight 300 | IBM Plex Mono 400 | Google Fonts |
| luxury alt | Fraunces 600 | Source Sans 3 400 | IBM Plex Mono 400 | Google Fonts |
| editorial | Bricolage Grotesque 800 | Bricolage Grotesque 400 | Space Mono 400 | Google Fonts |
| brutalist | Space Grotesk 700 | Space Grotesk 400 | Space Mono 400 | Google Fonts |
| consumer-warm | Bricolage Grotesque 700 | Geist 400 | JetBrains Mono | mixed |

### Шкала

```
display:  64px  / line 1.1   / tracking -0.03em / weight 800 / hero
h1:       48px  / line 1.15  / tracking -0.02em / weight 700 / page title
h2:       32px  / line 1.2   / tracking -0.015em/ weight 700 / section
h3:       24px  / line 1.3   / tracking -0.01em / weight 600 / card title
h4:       20px  / line 1.4   / tracking -0.005em/ weight 600 / subhead
body-lg:  18px  / line 1.7   / weight 400         / luxury body
body:     16px  / line 1.6   / weight 400         / main content
small:    14px  / line 1.5   / weight 400         / secondary
caption:  12px  / line 1.4   / tracking +0.01em / weight 500 / labels
mono:     14px  / line 1.6   / weight 400         / code, SKUs, order IDs
```

### Fluid typography (recommended)

Для responsive scale без media queries:

```css
:root {
  --font-display: clamp(2.5rem, 6vw + 1rem, 4rem);
  --font-h1:      clamp(2rem, 4vw + 1rem, 3rem);
  --font-h2:      clamp(1.5rem, 2.5vw + 0.8rem, 2rem);
  --font-body:    clamp(0.95rem, 0.2vw + 0.9rem, 1rem);
}
```

### Tracking rules

- Headings (display, h1-h4): negative tracking `-0.005em ... -0.03em`. Чем крупнее — тем сильнее минус.
- Body: 0em (default).
- Caption / labels / ALL CAPS: positive `+0.01em ... +0.08em`. ALL CAPS обязательно с tracking.
- `text-wrap: balance` на h1, h2 (минимизирует orphans).

### Forbidden fonts

- **Inter** — AI-look default. Запрещён как primary в proshop_mern.
- **Roboto, Open Sans, Arial, Helvetica, system-ui** — overused, generic.
- **Monospace as body** ("technical vibes" shortcut) — запрещён вне actual code blocks.

---

## Spacing

8px grid, без исключений:

```css
:root {
  --space-0:    0px;
  --space-1:    4px;   /* micro: icon + label gap */
  --space-2:    8px;   /* xs: tight padding */
  --space-3:    16px;  /* sm: component inner */
  --space-4:    24px;  /* md: card padding (default) */
  --space-5:    32px;  /* lg: section padding */
  --space-6:    48px;  /* xl: major sections */
  --space-7:    64px;  /* 2xl: page rhythm */
  --space-8:    96px;  /* 3xl: hero */
  --space-9:    128px; /* 4xl: luxury breathing */
}
```

Tailwind 4 `@theme`:

```css
@theme {
  --spacing-1:  4px;
  --spacing-2:  8px;
  --spacing-3:  16px;
  --spacing-4:  24px;
  --spacing-5:  32px;
  --spacing-6:  48px;
  --spacing-7:  64px;
  --spacing-8:  96px;
  --spacing-9:  128px;
}
```

**Compound rules для конкретных компонентов:**

```
Card padding:           24px (--space-4)
Card-compact padding:   16px (--space-3)
Button x-padding:       16px (--space-3)
Button y-padding:       8px  (--space-2)
Input padding:          12px y / 8px x (исключение, см. ниже)
Section padding-y:      48px (--space-6) mobile / 64px (--space-7) desktop
Page padding-x:         16px mobile / 32px tablet / 64px desktop max
Container max-width:    1200px standard / 720px sm / 480px xs
```

**Исключение про инпуты:** padding 8×12 нужен для visual balance с line-height — 12px x-padding выглядит как 16px из-за оптической компенсации. Это документированное отклонение, не free pass.

---

## Radius

```css
:root {
  --radius-none: 0px;     /* tables, data grids */
  --radius-sm:   4px;     /* badges, chips, code */
  --radius-md:   8px;     /* buttons, inputs */
  --radius-lg:   12px;    /* cards */
  --radius-xl:   16px;    /* modals, popovers */
  --radius-2xl:  24px;    /* luxury cards (preset B) */
  --radius-full: 9999px;  /* pills, avatars, toggles */
}
```

По направлениям:
- minimal-tech: cards 12px (lg), buttons 8px (md). Strict.
- luxury: cards 24px (2xl), pills full для primary CTA.
- editorial: cards 0 (none) или 4px sm; brutalist accent.
- consumer-warm: cards 16px (xl) — slightly softer.

---

## Elevation

### Default философия — no shadows (preset A, C)

```css
:root {
  /* Three-level elevation via background contrast */
  --elev-0: var(--background);   /* page */
  --elev-1: var(--card);         /* card surface */
  --elev-2: var(--card-alt);     /* modal, dropdown */
}
```

Никакого `box-shadow` на cards / buttons / inputs. Глубина воспринимается через bg contrast.

**Exception shadows** для floating elements (dropdown menu, tooltip, popover):

```css
:root {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
}

[data-theme="dark"] {
  /* Dark-mode shadows: больше opacity, иначе невидимы */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.55);
}
```

### Luxury философия — layered soft shadows (preset B)

Tinted shadows на warm bg, не pure black:

```css
[data-theme="light"][data-direction="luxury"] {
  --shadow-xs: 0 1px 2px rgba(28, 25, 23, 0.04);
  --shadow-sm: 0 2px 8px rgba(28, 25, 23, 0.06), 0 1px 3px rgba(28, 25, 23, 0.04);
  --shadow-md: 0 8px 24px rgba(28, 25, 23, 0.08), 0 2px 8px rgba(28, 25, 23, 0.05);
  --shadow-lg: 0 24px 48px rgba(28, 25, 23, 0.10), 0 8px 16px rgba(28, 25, 23, 0.06);
}
```

---

## Z-index scale

```css
:root {
  --z-base:     0;
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-overlay:  300;
  --z-modal:    400;
  --z-tooltip:  500;
  --z-toast:    600;
}
```

Никаких arbitrary z-index в компонентах. Только из этой шкалы.

---

## Token JSON (W3C Design Tokens spec, для tools)

После закрытия D1 — экспортируем выбранный preset в `tokens.json` в W3C Design Tokens Community Group format. Это позволит:
- Figma Tokens Studio sync.
- Style Dictionary build → CSS / Tailwind config / iOS / Android.
- Pencil MCP импорт.

Schema-стартер:

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "background": { "$type": "color", "$value": "{slate.950}" },
    "foreground": { "$type": "color", "$value": "{slate.50}" }
  },
  "spacing": {
    "1": { "$type": "dimension", "$value": "4px" },
    "2": { "$type": "dimension", "$value": "8px" }
  }
}
```

---

## Cross-refs

- Главный navigator: [`../../Design.md`](../../Design.md)
- A11y: [`accessibility.md`](accessibility.md)
- Motion: [`motion.md`](motion.md)
- Visual references: [`visual-references.md`](visual-references.md)
