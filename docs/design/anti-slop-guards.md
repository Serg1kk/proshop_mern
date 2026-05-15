# Anti-AI-Slop Guards — design declaration block

> Вставляется в CLAUDE.md / AGENTS.md или промпт-чат с любым AI-агентом (Claude Code, Cursor, Lovable, Bolt). Один раз — действует на весь проект.

---

## The block (copy-paste, always)

```markdown
## Design Principles (always apply, см. ../Design.md и docs/design/)

Be a human designer so it doesn't look like AI. With design taste.

— Generous spacing — plenty of whitespace, never cramped.
  Units: only 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128 px. NEVER arbitrary 14 / 18 / 22 px.
— Cards — subtle elevation via background contrast, padding 24px,
  NEVER heavy 2px borders. Border 1px solid var(--border).
— Typography — clean scale with negative tracking on headings.
  Font: see Design.md §2 (NOT default Inter — overused).
— NO box shadows by default. Depth from bg contrast — 3 levels:
  page (--background) → card (--card) → card-alt (--card-alt).
  Shadows ONLY for floating dropdown/tooltip/popover.
— EVERY interactive element MUST have: hover, focus-visible, active,
  loading, empty, error states. List them explicitly, do not skip.
— Visual hierarchy via proper heading levels H1 → H2 → H3 — never skip,
  never bold-as-heading substitute.
— Dark mode — CSS variables only: --background, --foreground, --card, --border.
  NEVER Tailwind dark: prefixes (dark:bg-gray-900 is a hack, not a system).
— Colors — semantic tokens only: var(--primary), var(--accent), var(--muted).
  NEVER raw hex or Tailwind color utility (text-blue-600) as brand color.
— Animations — purposeful only. CSS-only motion (2 curves cover 90% — see motion.md).
  NO decorative fade-in on static content. NO random all-at-once animations.
  Stagger entrance with 50-80ms between items (Apple-style).
— Layout — no AI-default structures:
  NO 2-column "before / after" comparison blocks,
  NO hero + 3 symmetric card grid as default,
  NO footer with 4 equal columns,
  NO cringe purple/violet linear-gradient on hero.
— Buttons — purposeful labels. NO "Click here", NO "Learn more".
  Every button describes its action: "Add to cart", "Place order, pay $84.50".
— Touch targets — minimum 24×24px (WCAG 2.2). Primary actions 44×44px (Apple HIG).
— Icons — SVG only (Lucide). NEVER emoji (🚀 ⚙️) as UI icons.
— Focus — outline 2px solid var(--ring), offset 2px, NEVER outline:none without replacement.
— Reduced motion — every animation media-gated with prefers-reduced-motion: reduce.
```

---

## What this block does

Без guard-rails AI генерирует «среднее по обучающим данным»:

- Inter font (дефолт shadcn out-of-box).
- `text-blue-600` или фиолетовая кнопка.
- 2-px borders на каждой карточке.
- `shadow-lg` рефлекторно.
- 2-column «без нас / с нами» comparison.
- `dark:bg-gray-900` как dark mode.
- All-elements-fade-in-at-once анимация.

Этот блок именует каждый паттерн **по имени и запрещает**. Чем точнее запрет, тем меньше места для «усреднённой» выдачи.

Фраза «Be a human designer so it doesn't look like AI. With design taste.» — семантический якорь. Слово «human» в дизайн-контексте контрастирует с AI-клише в training data: модель сдвигается в сторону high-quality reference, не frequent patterns. «With design taste» усиливает.

---

## 12 признаков AI-look — наш checklist

Из M4 cheatsheet «12 signs of AI-look». Каждый — должен fail в proshop_mern review.

| # | Признак | Тест |
|---|---------|------|
| 1 | Cringe gradients | `linear-gradient(... #6366f1 ... #a855f7 ...)` в codebase = fail. |
| 2 | 2-col comparison | «Without us / with us» layout = fail. |
| 3 | Inter везде | `font-family: 'Inter'` без замены = fail. |
| 4 | Cramped layouts | padding < 16px на cards = fail. |
| 5 | Heavy borders | `border-width: 2px` на cards = fail. |
| 6 | `shadow-lg` рефлекторно | `box-shadow` на cards/buttons без обоснования = fail. |
| 7 | `dark:bg-gray-900` | Tailwind `dark:` prefix вместо CSS vars = fail. |
| 8 | Random animations | All-elements-fade-in-at-once = fail. |
| 9 | Generic shadcn out-of-box | Default zinc/slate без кастомизации = fail. |
| 10 | Нет hover/focus/loading | Interactive без полного state set = fail. |
| 11 | UX ≠ journey | Hero на весь экран, CTA below fold = fail. |
| 12 | `text-blue-600` как accent | Tailwind color utility как brand color = fail. |

---

## Pre-flight checklist (перед каждым UI-промптом)

```
☐ Все цвета — design tokens (var(--*)), не raw hex.
☐ No box shadows — depth via bg contrast.
☐ Typography scale явно (H1 48 / H2 32 / body 16).
☐ Card pattern описан один раз.
☐ Mobile breakpoints явно (<640 / 640-1024 / >1024).
☐ Dark mode — CSS variables, не dark: prefixes.
☐ Buttons — purposeful labels, no "click here".
☐ Touch targets ≥ 24×24, primary 44×44.
☐ Все interactive states (hover/focus/active/loading/empty/error).
☐ Skeleton loaders для async, ARIA labels на icon buttons, contrast ≥ 4.5:1.
```

Если хоть один пункт `☐` после генерации — reject и переделать.

---

## Forbidden defaults (hard bans)

| Property | Default | Allowed alternative |
|----------|---------|---------------------|
| `font-family` body | `Inter`, system-ui as primary | **Plus Jakarta Sans** (Preset D, locked 2026-05-14). Per Design.md §2. |
| Primary color | `#6366f1` indigo | **`#1F4FCF` royal blue** (Preset D `--primary`). Components reference `var(--primary)` only. |
| Hero gradient | `linear-gradient(... purple ...)` | Solid `var(--background)` or subtle bg pattern |
| Card border | `2px solid #...` | `1px solid var(--border)` |
| Card shadow | `box-shadow: 0 10px 25px ...` | None (depth via bg contrast) |
| Dark mode | `dark:bg-gray-900` | CSS vars: `[data-theme="dark"] { --background: ...; }` |
| Icon as emoji | `🚀` `⚙️` `📦` | Lucide SVG |
| Button label | «Click here», «Learn more», «Submit» | Specific action: «Sign in», «Place order, pay $84» |
| Animation library | Framer Motion bundled by default | CSS only (см. motion.md), Framer only if state-dependent gestures needed |
| Layout | Hero + 3 symmetric card grid | Asymmetric or content-driven |

---

## Aesthetic directions (one to pick per project — D1)

См. [`../../Design.md`](../../Design.md) D1. Commit to ONE direction and execute fully — no half measures.

- **Brutally minimal** — monochrome, extreme whitespace, sparse typography.
- **Maximalist chaos** — overlapping elements, dense info, pattern mixing.
- **Retro-futuristic** — chrome effects, neon accents, 80s-inspired.
- **Luxury / refined** — gold/dark accents, serif fonts, generous spacing.
- **Playful / toy-like** — rounded corners, bright pastels, bouncy animations (note: bounce easing — exception для playful only).
- **Editorial / magazine** — grid-based, bold headlines, clean hierarchy.
- **Brutalist / raw** — monospace fonts, harsh contrasts, industrial.
- **Art deco** — sharp angles, metallic accents, ornate borders.

---

## When to push back на AI output

Phrases, которые срабатывают:

- **«That looks like AI slop. Rewrite the Design Declaration with a more committed aesthetic direction.»**
- **«I can see Inter and rounded cards. You violated the bans. Start over from the Design Declaration.»**
- **«The layout is hero → cards → CTA. That's the default. Give me something spatially unexpected.»**
- **«Name the aesthetic in 2 words. If you can't, the design has no point of view.»**
- **«What's the Signature Element? I don't see one.»**

---

## Sources

- M4 `prompts/anti-ai-slop-guards.md` (aidev-course-materials canon)
- M4 `cheatsheets/12-signs-of-ai-look.md`
- M4 `cheatsheets/pre-flight-checklist.md`
- Frontend-design skill (anti-slop variants 2026)
- Sailop «7 dimensions of AI slop» framework

---

## Cross-refs

- Main: [`../../Design.md`](../../Design.md)
- A11y: [`accessibility.md`](accessibility.md)
- Motion: [`motion.md`](motion.md)
- Microcopy: [`microcopy.md`](microcopy.md)
