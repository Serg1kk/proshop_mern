# Design.md — proshop_mern redesign

> **Single source of truth для редизайна.** Любой AI-агент или человек, который пишет UI-код в этом проекте, читает этот файл ПЕРЕД написанием первой строки.
> Открытый стандарт DESIGN.md (Google Stitch, апрель 2026) — машиночитаемые правила дизайна рядом с кодом, как CLAUDE.md, только для визуала.
>
> **Статус:** ACTIVE — visual direction **aurora-commerce** выбрана 2026-05-14 на основе 5 emox-скринов от Сергея (см. [`docs/design/references/emox-extract.md`](docs/design/references/emox-extract.md)). D1 / D5 / D6 / D8 закрыты. Ready for Phase 0.
> **Last updated:** 2026-05-14.

---

## TL;DR

1. **Что редизайним:** `proshop_mern` (legacy MERN demo) — учебный fork ProShop. Сейчас: React 16 + Bootstrap 4 (bundled `bootstrap.min.css`) + react-bootstrap. 17 screens, 12 components.
2. **Цель редизайна:** уйти от generic Bootstrap-look, сделать продукт с собственным дизайном-голосом для практики HSS-курса M4 («Прототипирование инструментов»). Демо-стенд для всех будущих модулей.
3. **Подход:** канонический DESIGN.md (10 разделов) + supporting docs в `docs/design/` + anti-AI-slop guards. Визуальное направление задаётся скриншотами-референсами Сергея (вставлять в [`docs/design/visual-references.md`](docs/design/visual-references.md)).
4. **Что НЕ редизайним сейчас:** backend API, redux state shape, маршруты. Только UI-слой.
5. **Inspired by стандарт M4 HSS:** [Google Stitch DESIGN.md spec](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/) (open standard с 2026-04-21).

---

## Decisions log

| # | Вопрос | Решение | Status | Sealed by |
|---|--------|---------|--------|-----------|
| **D1** | Визуальное направление | **aurora-commerce** — clean white + royal blue + iridescent pastel AI accent | ✅ CLOSED | emox extract 2026-05-14 |
| **D2** | Стек миграции | Tailwind 4 + shadcn/ui (с CSS vars из tokens.md, не Bootstrap) | ✅ CLOSED | default holds |
| **D3** | Dark mode | Light-first (emox shipped light-only). Dark mode = backlog V2 | ✅ CLOSED | emox extract 2026-05-14 |
| **D4** | Mobile-first / desktop-first | mobile-first (tablet/desktop primary breakpoint per emox, но компоненты mobile-ready) | ✅ CLOSED | emox extract |
| **D5** | AI-фичи | **(c) full conversational shopping assistant + AI image generation.** AI drawer = core P0, не optional. | ✅ CLOSED | emox extract 2026-05-14 |
| **D6** | Шрифт | **Plus Jakarta Sans** (display + body), JetBrains Mono (mono) | ✅ CLOSED | emox extract 2026-05-14 |
| **D7** | Migration approach | in-place — surgical screen-by-screen (как требует AGENTS.md, обновим Bootstrap-pinning notice при старте Phase 1) | ✅ CLOSED | default holds |
| **D8** | Motion | CSS-only **+** 1 custom: animated iridescent **aurora border** (signature). См. [`signature-elements.md`](docs/design/signature-elements.md) | ✅ CLOSED | emox extract 2026-05-14 |

**All blockers cleared.** Ready to start Phase 0 (foundation: install Tailwind 4 + Plus Jakarta Sans + globals.css with Preset D tokens).

---

## How this file is structured

DESIGN.md следует канонической структуре 10 разделов из M4 HSS-стандарта. Главный navigator — этот файл. Детальные таблицы и обоснования — в [`docs/design/*.md`](docs/design/). Линкуем туда вместо разрастания этого файла.

```
proshop_mern/
├── Design.md                              ← этот файл (navigator)
├── docs/
│   └── design/
│       ├── tokens.md                      ← §1-5: token'ы (Preset D = aurora-commerce active)
│       ├── signature-elements.md          ← aurora-border, sparkle ✨, AI gradient text, PriceLockup
│       ├── accessibility.md               ← §9: WCAG 2.1 AA + 2.2 deltas
│       ├── motion.md                      ← §8: motion system + reduced-motion
│       ├── microcopy.md                   ← UX writing: empty/error/success
│       ├── screen-inventory.md            ← 17 screens + 16 new components mapped
│       ├── ai-features-roadmap.md         ← AI patterns (CORE — P0 после emox extract)
│       ├── anti-slop-guards.md            ← guards для AI-агентов
│       ├── visual-references.md           ← фиксирует выбранное направление
│       └── references/
│           └── emox-extract.md            ← полный reverse-design extract из 5 emox-скринов
└── CLAUDE.md                              ← ссылается на Design.md
```

---

## §1 — Color Palette

> Подробные таблицы (light + dark mode, OKLCH coordinates, semantic mapping, контрастные пары) — [`docs/design/tokens.md#colors`](docs/design/tokens.md#colors).

**Принципы (locked, не зависят от D1):**

- ❌ Никогда не хардкодим hex в компонентах. Только семантические токены: `var(--primary)`, `var(--bg-surface)`, etc.
- ❌ Не `dark:bg-gray-900` префиксы. Dark mode — через переопределение CSS vars в `[data-theme="dark"]` или `.dark`.
- ✅ OKLCH-координаты для основных цветов (perceptually uniform, чистые dark-mode инверсии). 95%+ браузерной поддержки в 2026.
- ✅ Two-tier token system: primitives (`--blue-500`) → semantic (`--primary`). Компоненты используют **только** semantic. Без component-level третьего уровня (не Atlassian с 37K токенов).
- ✅ Indigo/violet — **запрещены** как primary без явного обоснования (это AI-slop default `#6366f1`). См. [`anti-slop-guards.md`](docs/design/anti-slop-guards.md).

**Semantic roles (минимальный набор, M4 canon):**

```
--background      page bg
--foreground      primary text on bg
--card            card surface (elevation L1)
--card-alt        elevated card (elevation L2)
--primary         primary action color
--primary-fg      text on primary bg
--muted           muted text, hints
--accent          highlight, secondary CTA
--destructive     errors, delete
--success         confirmations
--warning         soft warnings
--border          dividers, hairlines
--ring            focus ring
```

**Конкретные hex/OKLCH значения** — после выбора D1 (визуального направления) и D6 (шрифта). Темплейтные подборки под каждое направление лежат в [`tokens.md#palette-presets`](docs/design/tokens.md#palette-presets).

---

## §2 — Typography

> Полная шкала + font imports + tracking rationale — [`tokens.md#typography`](docs/design/tokens.md#typography).

**Принципы (locked):**

- ❌ Inter — **запрещён** как primary шрифт. Перенасыщен до невидимости (#1 признак AI-look).
- ✅ Один display + один body шрифт. Максимум два семейства. Mono — третье, только для product codes / SKUs / order IDs.
- ✅ Negative tracking на headings (`-0.02em ... -0.03em`) для technical-feel; positive tracking на ALL CAPS (`+0.06em ... +0.08em`).
- ✅ `text-wrap: balance` на h1/h2.
- ✅ Body 16px минимум (`18px` для luxury-направлений). `line-height: 1.5+` для длинных текстов.

**Шкала (M4 canon, 8 шагов):**

```
display   64px   weight 800   tracking -0.03em   — hero
h1        48px   weight 700   tracking -0.02em   — page title
h2        32px   weight 700   tracking -0.015em  — section
h3        24px   weight 600   tracking -0.01em   — card title
h4        20px   weight 600   tracking -0.005em  — subhead
body      16px   weight 400   line-height 1.6    — main content
small     14px   weight 400   line-height 1.5    — secondary
caption   12px   weight 500   tracking +0.01em   — labels
```

**Финальный font pairing** — зависит от D1. Кандидаты:
- minimal-tech → Manrope + JetBrains Mono *(M4 reference: design-system-pack-example)*
- luxury → Playfair Display + Inter Tight + IBM Plex Mono
- editorial → Fraunces + Bricolage Grotesque
- consumer-warm → Bricolage Grotesque + Geist

---

## §3 — Spacing Scale

**Locked (M4 canon):**

```
4px   micro      icon + label
8px   xs         tight padding (table cells)
16px  sm         component inner padding
24px  md         card padding
32px  lg         section padding
48px  xl         between major sections
64px  2xl        page-level rhythm
96px  3xl        hero / splash
128px 4xl        editorial breathing (luxury только)
```

**Правило:** только кратные 8px. Никаких 12px / 14px / 18px / 22px. Если AI генерит arbitrary value — реджектим в review.

---

## §4 — Border Radius

```
none    0px      tables, data grids, brutalist accents
sm      4px      badges, chips, code blocks
md      8px      buttons, inputs (default)
lg      12px     cards (default)
xl      16px     modals, popovers
full    9999px   pills, avatars, toggles, primary CTA (luxury only)
```

Финальная подборка по направлению — в [`tokens.md#radius`](docs/design/tokens.md#radius).

---

## §5 — Elevation / Shadow

**Default философия (для minimal-tech / consumer-warm / brutalist):**

> **NO box shadows.** Глубина через контраст фона: page → card → card-alt (3 уровня).

Исключения — только для floating elements: dropdown menu, context menu, tooltip. Тогда — мягкие layered shadows с opacity ≤ 0.08.

**Альтернативная философия (luxury-serif):**

Subtle layered shadows разрешены, но никогда `rgba(0,0,0,...)` — использовать tinted foreground color с низкой opacity (`rgba(28,25,23,0.04)` etc.).

Полные shadow tokens — [`tokens.md#elevation`](docs/design/tokens.md#elevation).

---

## §6 — Component Patterns

> Полный mapping существующих proshop_mern компонентов на новые паттерны — [`screen-inventory.md`](docs/design/screen-inventory.md). Здесь — только канонические rules.

### Existing components map (12 атомов)

```
frontend/src/components/
├── Header.js              → Navbar (sticky, mobile-collapsed menu)
├── Footer.js              → Footer (3-col на desktop, stack на mobile)
├── Product.js             → ProductCard (img / title / rating / price)
├── Rating.js              → StarRating (a11y: aria-label="4 of 5 stars")
├── SearchBox.js           → SearchInput (autocomplete-ready, см. AI roadmap)
├── ProductCarousel.js     → HeroCarousel (pause/stop controls, WCAG 2.2 §dragging)
├── Paginate.js            → Pagination (keyboard-navigable arrows)
├── CheckoutSteps.js       → CheckoutProgress (4 шага, current/done/upcoming)
├── FormContainer.js       → FormShell (centred max-w container)
├── Loader.js              → SkeletonShimmer (заменить spinner на skeleton)
├── Message.js             → Alert (variant: info/success/warning/destructive)
└── Meta.js                → SEO meta (не UI, оставляем)
```

### Existing screens (17, group по domain)

```
Storefront (public):       Home / Product / Cart / Login / Register
Checkout flow:              Shipping → Payment → PlaceOrder → Order
Account:                    Profile
Admin:                      UserList / UserEdit / ProductList / ProductEdit / OrderList / FeatureFlagList
```

Состояние каждого screen + redesign-приоритет — [`screen-inventory.md`](docs/design/screen-inventory.md).

### Канонические компонент-rules

- **Card.** bg `var(--card)` / padding 24px / radius `var(--radius-lg)` / border `1px solid var(--border)` / hover → border-color `var(--primary)` 150ms ease. Без `shadow-lg` рефлекторно.
- **Button.** Только три варианта primary / secondary / ghost. `destructive` — отдельно для delete-actions. Min height 40px, min touch target 44×44px (WCAG 2.2 §2.5.8). Loading state — spinner + opacity 0.7 + `aria-busy`.
- **Input.** Border 1px / focus → `box-shadow: 0 0 0 2px var(--ring)/20%`. Label всегда visible, никогда не только placeholder (WCAG §3.3.2).
- **Modal.** `role="dialog"` / `aria-modal="true"` / focus trap / Escape close / focus return на trigger.
- **Toast / alert.** Если важно — не auto-dismiss. Live region `aria-live="polite"` для non-critical, `"assertive"` для critical.

---

## §7 — Interactive States

**Каждый** interactive element обязан иметь полный набор:

| State | Required | Pattern |
|-------|----------|---------|
| `default` | ✅ | normal |
| `hover` | ✅ (desktop) | bg / border / color shift, 150ms ease |
| `focus-visible` | ✅ | `outline: 2px solid var(--ring); outline-offset: 2px` — never remove |
| `active` | ✅ | scale(0.98) или brightness shift |
| `loading` | ✅ для async | skeleton shimmer ИЛИ inline spinner + opacity 0.7 + `aria-busy` |
| `empty` | ✅ для lists | 48px icon (muted) + title + description + 1 CTA |
| `error` | ✅ для inputs | red border + помощь "что сделать" под полем, `role="alert"` |
| `disabled` | ✅ | opacity 0.4 + `cursor: not-allowed` + `pointer-events: none` |

**Никогда не пропускаем `empty` и `error`.** AI-генерация по умолчанию делает только happy path. См. [`microcopy.md`](docs/design/microcopy.md) — копирайт-патерны и acknowledge/explain/instruct framework для error states.

---

## §8 — Motion / Animation

> Полная система с easing tokens и reduced-motion fallbacks — [`motion.md`](docs/design/motion.md).

**Сжато (Frigade-style, 2 curves cover 90%):**

```css
:root {
  /* Durations */
  --duration-fast:  150ms;   /* hover, focus, micro-feedback */
  --duration-base:  220ms;   /* dropdown, modal, toggle */
  --duration-slow:  480ms;   /* page enter, hero reveal */

  /* Curves */
  --ease-entrance:    cubic-bezier(0.23, 1, 0.32, 1);   /* fast attack, gentle settle */
  --ease-interaction: cubic-bezier(0.32, 0.72, 0, 1);   /* tight, immediate */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Что разрешено:**
- Transform + opacity (GPU-accelerated).
- Skeleton shimmer 1.5s infinite ease-in-out.
- Stagger 50-80ms между элементами списков на entrance (Apple style, не all-at-once).
- Hover scale 1.01-1.02 на cards/buttons.

**Что запрещено:**
- Анимация width / height / margin / padding (layout thrash).
- Decorative bounce / elastic curves (`cubic-bezier(0.34, 1.56, 0.64, 1)` — bounce — feels tacky в 2026).
- All-elements-fade-in-at-once на entrance.
- Auto-advancing carousels без pause control (WCAG §2.2.2).

---

## §9 — Accessibility

> Полный гайд (WCAG 2.1 AA + 2.2 deltas + e-commerce-specific checklist + screen reader test plan) — [`accessibility.md`](docs/design/accessibility.md).

**Hard requirements для proshop_mern:**

1. **Contrast.** Body text ≥ 4.5:1, UI components ≥ 3:1. Проверка через webaim.org/resources/contrastchecker.
2. **Keyboard navigation.** Полная покупка от Home до OrderScreen без мыши. Не должно быть keyboard trap.
3. **Focus visible.** `outline: 2px solid var(--ring)` всегда виден, не перекрыт sticky header (WCAG 2.2 §2.4.11 Focus Not Obscured) — `scroll-padding-top` на html.
4. **Touch targets.** Минимум 24×24px (WCAG 2.2 §2.5.8 minimum); рекомендация 44×44px для primary actions.
5. **Forms.** Each input — visible label (не только placeholder). Inline validation + descriptive error linked via `aria-describedby`.
6. **Modals / cart drawer.** `role="dialog"` + focus trap + Escape close + focus return.
7. **Carousel** (HomeScreen ProductCarousel). Provide pause/prev/next button + arrow keys + WCAG 2.2 §2.5.7 dragging alternative.
8. **Live regions.** Cart updates, filter changes, login errors → `aria-live="polite"` / `"assertive"`.
9. **Skip-to-content.** Первым focusable элементом в `<header>`.
10. **Reduced motion.** Все animations media-gated.

**Compliance target:** WCAG 2.1 Level AA + 6 новых AA criteria из WCAG 2.2 (Focus Not Obscured, Dragging Movements, Target Size, Consistent Help, Redundant Entry, Accessible Authentication).

---

## §10 — Format Declaration (зависит от D2)

**Если D2 = (b) Tailwind 4 + shadcn/ui — рекомендованный путь:**

```
Component library:  shadcn/ui (copy-paste, owned)
CSS framework:      Tailwind CSS 4 (CSS variables, @theme directive)
Token system:       CSS custom properties on :root and .dark
Icon set:           Lucide Icons (1.5px stroke, tree-shakeable)
Forms:              react-hook-form + Zod
Motion:             CSS only (см. §8). Framer Motion — только если появится feature, где CSS не хватит.
```

**Migration plan (D2.b):**
1. Установить Tailwind 4 + initialize `globals.css` с CSS vars из [`tokens.md`](docs/design/tokens.md).
2. Поэтапно удалять `bootstrap.min.css` из `frontend/src/index.js` — screen за screen.
3. Заменить `react-bootstrap` компоненты на shadcn/ui по mapping из [`screen-inventory.md`](docs/design/screen-inventory.md). Один screen — один PR.
4. Финальный шаг: удалить `react-bootstrap` и `react-router-bootstrap` из `package.json`, удалить bundled `bootstrap.min.css`.

**Если D2 = (a) keep Bootstrap:** SCSS-override через CSS vars + custom theme via `_variables.scss`. Tokens из этого файла, но через Bootstrap mixins. Меньше работы, но получим Bootstrap-look с минимальной кастомизацией. **Не рекомендую** — противоречит цели «уйти от generic».

---

## §11 — Anti-AI-Slop Guards (M4 standard, всегда применяется)

> Полный блок — [`anti-slop-guards.md`](docs/design/anti-slop-guards.md). Линкуется из `CLAUDE.md` / `AGENTS.md`, чтобы любой AI-агент в проекте видел его автоматически.

Hard bans (без исключений):

- ❌ Inter как primary font.
- ❌ Purple/violet gradient на hero (`linear-gradient(... #6366f1 ... #a855f7 ...)`).
- ❌ `shadow-lg` рефлекторно на каждой карточке.
- ❌ `dark:bg-gray-900` как dark mode — только CSS variables.
- ❌ `text-blue-600` / любой Tailwind utility как brand color (только `var(--primary)`).
- ❌ 2-column comparison blocks ("без нас / с нами").
- ❌ Hero + 3 symmetric cards grid как landing default.
- ❌ Footer с 4 равными колонками.
- ❌ `Click here` / `Learn more` button labels.
- ❌ All-elements-fade-in-at-once анимация.
- ❌ Icons as emoji (🚀 ⚙️) — только SVG (Lucide).
- ❌ Hero metric template (big number + label + supporting stats + gradient accent).

---

## §12 — Voice & microcopy

> Полные паттерны (acknowledge/explain/instruct для errors, formula `[explanation] + [CTA]` для empty states, 100 e-commerce microcopy lines) — [`microcopy.md`](docs/design/microcopy.md).

Базовые rules:

- **Buttons:** purposeful labels. «Add to cart» лучше «Submit». «Save shipping address» лучше «Save».
- **Errors:** acknowledge what happened → explain why → instruct fix. «Card number looks incomplete. Check the last 4 digits and try again.»
- **Empty states:** explanation + clear next action. «No products yet. Browse the catalog to add your first item.»
- **No blame language.** Не «You entered an invalid email» → «Email doesn't look quite right. Try again.»

---

## §13 — AI features roadmap (опционально, см. D5)

> Полный roadmap (conversational shopping assistant, semantic search bar, agentic upsell, AI product recommendations с confidence indicators) — [`ai-features-roadmap.md`](docs/design/ai-features-roadmap.md).

Если выбран D5.a (только визуал сейчас) — этот раздел остаётся как backlog для future модулей курса.

---

## §14 — Screen redesign roadmap

> Inventory всех 17 screens + redesign приоритет + new component mapping + ASCII-wireframe placeholders — [`screen-inventory.md`](docs/design/screen-inventory.md).

**Приоритеты P0 → P3:**

- **P0 (week 1):** Home, Product, Cart, Header / Footer — основной customer-facing flow.
- **P1 (week 2):** Login, Register, Profile, Checkout flow (Shipping → Payment → PlaceOrder → Order).
- **P2 (week 3):** Admin screens (UserList, ProductList, OrderList).
- **P3 (week 4):** Edit-screens (UserEdit, ProductEdit) + FeatureFlagList.

---

## §15 — Visual references — CLOSED

✅ Сергей предоставил 5 скринов **emox** (AI-native UAE fashion-marketplace) — 2026-05-14. Reverse-design extract выполнен в [`docs/design/references/emox-extract.md`](docs/design/references/emox-extract.md).

Сводка для quick-reference:
- **Direction:** aurora-commerce (clean white + royal blue + iridescent pastel AI accent).
- **Primary blue:** `#1F4FCF` (royal, vibrant, not neon).
- **Backgrounds:** `#FFFFFF` page / `#F1F4F8` product-tinted-card surface.
- **Font:** Plus Jakarta Sans.
- **Radius:** 12px cards, 9999px buttons & chips, 6px size-pills.
- **Signature 1 — aurora border:** animated iridescent stroke `#FF9FCB → #C5A9FF → #8FC8FF → #B5F0C8 → #FFD78F` на active/AI inputs.
- **Signature 2 — sparkle ✨:** gradient-filled, indicates AI entry point (search prefix, AI message marker, prompt input).
- **Signature 3 — PriceLockup:** bold number + uppercase muted currency suffix («300 AED»).
- **AI is core:** AIDrawer (closable right-side panel) с conversation thread + Generate-images CTA + suggestion chips + voice mic — это P0, не backlog.

---

## Cross-refs

**Внутри этого проекта:**
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — операционные rules, ссылается на Design.md.
- [`README.md`](README.md) — runbook, не дизайн.

**M4 HSS canonical materials (read-once для context):**
- [DESIGN.md as 2026 standard](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/guides/design-md-as-2026-standard.md)
- [Tokens extraction walkthrough](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/examples/design-tokens-extraction-walkthrough.md)
- [Anti-AI-slop guards](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/prompts/anti-ai-slop-guards.md)
- [Accessibility expert prompt](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/agents/accessibility-expert/prompt.md)
- [Design system pack example (minimal-tech)](https://github.com/Serg1kk/aidev-course-materials/tree/main/M4/design-system-pack-example)
- [12 signs of AI-look cheatsheet](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/cheatsheets/12-signs-of-ai-look.md)
- [Pre-flight checklist](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/cheatsheets/pre-flight-checklist.md)
- [shadcn pipeline](https://github.com/Serg1kk/aidev-course-materials/tree/main/M4/prompts) — 3-step (ux-structure → component-mapping → final-implementation).

**External (research-backed):**
- [Google Stitch DESIGN.md open standard announcement (2026-04-21)](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/)
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/
- OKLCH playground: https://oklch.com/

---

> _«Be a human designer so it doesn't look like AI. With design taste.»_ — M4 magic phrase, всегда первой строкой в любом UI-промпте.
