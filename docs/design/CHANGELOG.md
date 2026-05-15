# CHANGELOG — design system files

> Changes applied during the `good_shop` reference implementation pass
> (Eco-site project, 2026-05-14). Each entry: what changed, why,
> and how to apply if these files are taken back to `proshop_mern`.

All changes are **non-breaking documentation alignments** — no new conflicting
directions were introduced. The system direction (D1 aurora-commerce, D6 Plus
Jakarta Sans, D8 aurora border) is unchanged.

---

## Why this audit happened

I built a working Home-screen reference (`good_shop`) using these design docs
as the single source of truth. While implementing, I found four places where
the docs disagreed with each other or with what was reasonable to ship. The
disagreements are documented and resolved below.

If you want to keep the docs as-is, none of these changes are required — but
agents reading the docs may produce inconsistent CSS class names or token
values. Recommended to apply all of them.

---

## 1. `Design.md` § 4 — Border Radius

**Problem.** The §4 scale (`sm 4 / md 8 / lg 12 / xl 16 / full`) is the M4
canonical default, but the **active** Preset D in
[`tokens.md`](docs/design/tokens.md) uses a different scale
(`xs 4 / sm 6 / md 12 / lg 16 / xl 20 / pill`). Two different "default radius"
values for buttons (`md 8px` vs `pill 9999`). Agents will pick whichever they
see first.

**Fix.** Kept the canonical scale as reference, added the Preset D scale below
it, and a `> Note:` block stating components MUST reference Preset D names via
`tokens.md` — not the canonical labels.

**Where.** `Design.md` § 4. Marker: "Active scale — Preset D".

---

## 2. `Design.md` § 1 — semantic token list

**Problem.** Listed `--accent` as "highlight, secondary CTA" — implying a
solid color. But in Preset D, `--accent` was set to `var(--aurora-gradient)`
— a gradient, which cannot be used as `color` or `border-color`. Misleading.

**Fix.** Split into two lines: `--accent` (solid color, for presets A/B/C)
and `--accent-gradient` (signature gradient, Preset D only — background-image
only).

**Where.** `Design.md` § 1, semantic roles block. Also in `tokens.md` Preset D
the token was renamed `--accent` → `--accent-gradient` with an inline comment.

---

## 3. `tokens.md` — Preset D radius vs generic Radius section

**Problem.** `tokens.md` has both a Preset D-specific radius block (lines ~144)
**and** a generic Radius section at the end (lines ~420). The generic one uses
the M4-canon labels (`sm 4 / md 8 / lg 12 ...`), which conflicts with Preset
D's (`xs 4 / sm 6 / md 12 ...`). Same token names, different values.

**Fix.** Added a `> Active project uses Preset D values` note at the top of
the generic Radius section, pointing back to Preset D. The generic table is
preserved as historical reference for pivots to A / B / C.

**Where.** `docs/design/tokens.md`, `## Radius` heading.

---

## 4. `tokens.md` — Preset D `--accent` token name

**Problem.** Preset D set `--accent: var(--aurora-gradient)`. A gradient
should never be assigned to a `--accent` token name because (a) component
authors expect to use it as `color` (broken), (b) the name doesn't telegraph
"this is a CSS image, not a paint".

**Fix.** Renamed to `--accent-gradient` with an inline comment:
`/* gradient ONLY — use as background-image, not color/border-color */`.

**Where.** `docs/design/tokens.md`, Preset D `--accent`/semantic block.

---

## 5. `signature-elements.md` — BEM `--` modifier → SUIT `is-*`

**Problem.** Doc used BEM-style modifier syntax (`.aurora-border.--static`,
`.price-lockup.--lg`). Two issues:
1. Most React codebases use SUIT-style (`is-*`) or BEM with `__` /
   `_modifier`, not naked double-dash. Naked `--static` reads as a CSS custom
   property at a glance and stutters in tooling.
2. The reference implementation I built used `.is-static` / `.is-lg` because
   that's what shadcn / Radix / most React component libraries do.

**Fix.** Replaced 5 occurrences:
- `.aurora-border.--static` → `.aurora-border.is-static`
- `.aurora-border.--subtle` → `.aurora-border.is-subtle`
- `.price-lockup.--lg` → `.price-lockup.is-lg`
- `.price-lockup.--strike` → `.price-lockup.is-strike`
- `.price-lockup.--from` → `.price-lockup.is-from`

Added a `> Naming convention` note explaining the choice.

**Where.** `docs/design/signature-elements.md`, sections "Aurora border ·
Variants" and "Price lockup · Variants".

---

## 6. `screen-inventory.md` — leftover BEM names

**Problem.** PDP redesign block referenced `AuroraBorder.--static` and
`PriceLockup .--lg` — same BEM-style as above, three occurrences.

**Fix.** Same swap: `.--static` → `.is-static`, `.--lg` → `.is-lg`.

**Where.** `docs/design/screen-inventory.md`, ProductScreen section
(lines ~128, 134, 138).

---

## 7. `tokens.md` — touch-target tokens promoted

**Problem.** Touch-target sizes (`--target-min`, `--target-default`,
`--target-primary`) were defined inside `accessibility.md`, not `tokens.md`.
Agents looking at the tokens file would not see them. Two sources of truth.

**Fix.** Moved the canonical definition into `tokens.md` (Preset D section,
under "Specific component sizing"). `accessibility.md` now references
`tokens.md` as the canonical source instead of redefining.

**Where.**
- `docs/design/tokens.md` — added `## Touch-target tokens` block after
  "Specific component sizing for Preset D".
- `docs/design/accessibility.md` — § 2.5.8 Target Size, replaced the inline
  block with a reference to `tokens.md`.

---

## 8. `anti-slop-guards.md` — outdated "TBD per D1" placeholders

**Problem.** Two cells in the "Forbidden defaults" table said
`TBD per D1 / preset selected`. But D1 has been closed since 2026-05-14
(aurora-commerce, royal blue primary). Placeholders are stale.

**Fix.** Filled in the closed values:
- `font-family` body → **Plus Jakarta Sans** (Preset D, locked 2026-05-14)
- Primary color → **`#1F4FCF` royal blue** (`var(--primary)` in components)

**Where.** `docs/design/anti-slop-guards.md`, "Forbidden defaults" table.

---

## What was NOT changed

I deliberately left these alone because they are correct or stylistic:

- **Other presets (A / B / C) in `tokens.md`** still use `--accent` (a solid
  color) — that's right; they aren't gradients.
- **Font candidate table in `tokens.md`** still shows Manrope / Playfair /
  etc. for the inactive presets — kept as reference for a possible pivot.
- **Generic radius scale in `tokens.md`** — kept as a fallback reference for
  non-D presets. Just clearly labelled as such.
- **Inter Tight in luxury preset** — Inter Tight is a distinct font from
  Inter Regular, and it's specifically allowed for luxury direction. Not the
  banned default.
- **`accessibility.md` § Color contrast pairs table** — still has `TBD`
  values. Those should be filled after running webaim.org/contrastchecker
  on the actual built CSS, which is implementation work, not doc cleanup.

---

## How to apply back to `proshop_mern`

Each change is a small `str_replace`-friendly diff. You can either:

**Option A** — drop the whole `docs/design/` folder + `Design.md` from this
project over the corresponding files in `proshop_mern`. Safe, every change
is non-breaking.

**Option B** — apply changes individually using the sections above as a
spec. Sections 1, 2, 4 affect `Design.md` and `tokens.md` and are the
highest-value (resolve real contradictions). Sections 5, 6 (naming) are
optional if you prefer the BEM style.

---

## Cross-refs

- Main: [`Design.md`](../../Design.md)
- Tokens: [`tokens.md`](tokens.md)
- Signature: [`signature-elements.md`](signature-elements.md)
- A11y: [`accessibility.md`](accessibility.md)
- Anti-slop: [`anti-slop-guards.md`](anti-slop-guards.md)
- Screen inventory: [`screen-inventory.md`](screen-inventory.md)
