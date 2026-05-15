# Screen Inventory & Redesign Roadmap

> Раскрытие §14 из [`../../Design.md`](../../Design.md). Полный список 17 screens + 12 components + redesign priority + проблемы текущего UI + new component mapping.

---

## Current stack snapshot

```
frontend/
├── src/
│   ├── App.js                 — React Router v5, BrowserRouter, ~22 routes
│   ├── store.js               — Redux + thunk
│   ├── index.css              — global resets (rather minimal)
│   ├── bootstrap.min.css      — bundled, ~177KB, pinned (AGENTS.md)
│   ├── components/            — 12 atoms (Header, Footer, Product, …)
│   ├── screens/               — 17 screens
│   ├── actions/, reducers/    — Redux state
│   └── constants/             — action types
└── package.json               — React 16, react-bootstrap 1.3, react-router-dom 5.2
```

**Текущие проблемы (audit baseline):**
- Generic Bootstrap 4 look — нет brand identity.
- Нет dark mode.
- Нет проектных design tokens (всё через Bootstrap defaults).
- Mobile UX неоптимален (sticky Add-to-cart отсутствует, mobile cart drawer не реализован).
- A11y gaps: `Loader.js` — spinner без `aria-busy`, `Message.js` — Alert без `role="alert"`, ProductCarousel без pause control, form inputs местами только placeholder.
- Microcopy generic («Submit», нет error guidance).
- Empty states отсутствуют (или дефолтные Bootstrap).

---

## Component inventory (12 components)

| Component | LOC | Сейчас | Новое назначение | Replace? |
|-----------|-----|--------|-------------------|----------|
| `Header.js` | 80 | react-bootstrap Navbar | Custom Navbar (sticky, mobile collapse, search bar prominent) | refactor |
| `Footer.js` | 14 | static text | Footer (3 cols → stack mobile, help links, trust signals) | refactor |
| `Product.js` | 30 | react-bootstrap Card | ProductCard (image / title / price / rating / quick CTA) | refactor |
| `ProductCarousel.js` | 40 | react-bootstrap Carousel | HeroCarousel w/ pause/prev/next + WCAG 2.2 §dragging | refactor |
| `Rating.js` | 60 | inline JSX with star icons | StarRating (aria-label, semantic markup) | refactor |
| `SearchBox.js` | 30 | react-bootstrap Form | SearchInput (autocomplete-ready, AI hooks optional) | refactor |
| `Paginate.js` | 30 | react-bootstrap Pagination | Pagination (keyboard nav, aria-current) | refactor |
| `CheckoutSteps.js` | 45 | react-bootstrap Nav | CheckoutProgress (4 steps, current/done/upcoming visual) | refactor |
| `FormContainer.js` | 13 | react-bootstrap Container | FormShell (max-w-md, centred, spacing tokens) | refactor |
| `Loader.js` | 16 | react-bootstrap Spinner | SkeletonShimmer (default) + Spinner (только для button busy) | replace |
| `Message.js` | 10 | react-bootstrap Alert | Alert (variant info/success/warning/destructive + role="alert") | refactor |
| `Meta.js` | 18 | react-helmet | (не UI, оставляем) | keep |

**Новые компоненты, которых нет** (расширен после emox extract 2026-05-14):

### Базовые (всегда нужны)

| New | Используется на |
|-----|------------------|
| `Button` (primary/secondary/ghost/destructive variants) | Везде |
| `Input` / `Label` / `Field` | Все forms |
| `Card` (base, interactive, compact, tinted-product variants) | ProductScreen, OrderScreen, admin |
| `Modal` / `Dialog` (a11y-correct) | Delete confirm |
| `Toast` / `Notification` (live region) | Cart updates, save success |
| `EmptyState` | Cart empty, no products, no orders |
| `Skeleton` (text / card / row variants) | Все async loads |
| `Badge` / `Chip` (status, category) | OrderScreen (status), ProductScreen (out-of-stock) |
| `Stepper` (quantity +/-) | CartScreen |
| `Breadcrumb` | ProductScreen, admin screens |
| `PriceLockup` | Везде где price — bold num + uppercase muted currency suffix |

### emox-specific (extracted 2026-05-14, см. emox-extract.md)

| Component | Описание | Used on |
|-----------|----------|---------|
| `AuroraBorder` | wrapper с animated iridescent gradient stroke. Variants: animated / static / subtle | SearchInput, AIPromptInput, selected tile/thumbnail |
| `SparkleIcon` | 4-point burst SVG, gradient-filled when AI-active | Search prefix, AI message marker, AI input prefix, AI CTAs |
| `AIDrawer` | right-side closable panel — composed of: header (× close), conversation, contextual CTA card, suggestion chips, prompt input | Storefront pages (Home, Product, search results) |
| `AIMessage` | chat bubble — user variant (right, gray pill bg) + assistant variant (left, no bubble, ✨ prefix, supports emoji) | Inside AIDrawer |
| `AIPromptInput` | text input + sparkle prefix + voice mic suffix + aurora border (animated) | Bottom of AIDrawer |
| `SuggestionChip` | one-tap fill-input chip, used below AI CTA cards и в empty AI state | AIDrawer |
| `GenerateImagesCard` | promo card: 3D illustration thumbnail + bold copy + primary CTA + 3 suggestion chips | Inside AIDrawer |
| `AIIdentityBadge` | gradient «Ai» wordmark (background-clip text + aurora gradient) | AIDrawer header |
| `BrandStrip` | horizontal scrollable row of brand cards | Home, search results above product grid |
| `BrandCard` | small card: brand image + name + 5-star rating + count + "Visit shop" link | Inside BrandStrip |
| `FilterChipBar` | horizontal row of dropdown-pill filters (each with chevron-down) | Home, search results |
| `FilterChip` | individual filter pill «Category ▾», «Rating ▾», «Sort by ▾» | Inside FilterChipBar |
| `SizeSelector` | row of square radius pills (XS / S / M / L / XL / 2XL), mutually exclusive | ProductScreen (PDP) |
| `BNPLRow` | «As low as $38/mo with [partner-pill] [partner-pill] Learn how» | ProductScreen (under price), Cart summary (опц.) |
| `PartnerPill` | branded pill для BNPL partner (tabby green, tamara peach, etc.) | Inside BNPLRow |
| `ProtectionPlanCard` | upsell card: shield icon + "Add Protection Plan / View Details" + N plan toggleable pills | ProductScreen |
| `DeliveryOptionTile` | tile pair (Shipping / Pickup) — icon + label + status (Free / Arrives X / Not available) + selected aurora border | ProductScreen, CartScreen |
| `SellerInfoBlock` | "Sold and shipped by [name]" + star rating + review count link | ProductScreen |
| `PromoBadge` | "Best Deals" (gift icon + purple text) / "emox Live" (red dot + text) — special header sub-nav links | Header sub-nav |
| `CountrySelector` | flag + country code + chevron-down (UAE flag in emox; для proshop_mern — может быть USD/EUR/etc.) | Header right |
| `LocationIndicator` | pin icon + "Delivering to [city]" + "Update Location" link | Header (PDP, маркет area) |

---

## Screen inventory (17 screens)

### P0 — week 1 (customer-facing core + AIDrawer shell)

#### `HomeScreen.js` — Product listing + search results

**Current:**
- Bootstrap Container + Row + Col grid.
- ProductCarousel сверху (if no keyword) → product grid → Paginate.
- 3-col grid на desktop, 1-col mobile.

**Redesign (emox-style):**
- FilterChipBar (sticky на scroll): Category / Rating / Gender / Size / Color / Price / Sort by — pill-shaped dropdowns.
- BrandStrip (horizontal scrollable, 4-6 brand cards visible) с «View All →» link.
- Product grid: 4-5 columns desktop / 3 tablet / 2 mobile, `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`.
- ProductCard: image в tinted `--card` bg, heart top-right, title, blue stars + count «(2.6k)», PriceLockup (number + AED uppercase suffix).
- AIDrawer открыт справа по умолчанию (на десктопе) или collapsed-floating-button на mobile.
- Empty state: «No products yet.» для admin-cleared catalog. «No matches for "X". Try a different search.» для filtered.
- Skeleton placeholders — 6-10 cards while loading.

**Priority: P0.**

#### `ProductScreen.js` — Product detail (PDP)

**Current:**
- 3-col layout: image / details / buy-zone.
- Reviews section внизу.

**Redesign (emox-style):**
- Breadcrumb top: Home / Category / Sub / ProductName.
- 50/50 split: image-zone left, details-zone right.
- Image-zone: main image в tinted card `--card` bg, heart + share icons top-right, 5-thumbnail strip below (selected — `AuroraBorder.is-static`).
- Details-zone:
  - Brand link (small `--primary` color).
  - h1 product title.
  - StarRating + review count + Compare link (with double-arrow icon).
  - SizeSelector pills (square radius, mutually exclusive).
  - PriceLockup `.is-lg` («From 402.32 AED»).
  - BNPLRow («As low as $38/mo with tabby + tamara · Learn how»).
  - Primary CTA «Add to cart» — pill, full-width, 56px tall.
  - ProtectionPlanCard (упсель, 2-3 plan options).
  - "How you'll get this item:" + DeliveryOptionTile pair (Shipping selected `AuroraBorder.is-static` / Pickup disabled).
  - LocationIndicator row: «Sacramento, 96898 Change · Arrives Fri, Feb 20 · More option».
  - SellerInfoBlock.
  - "Free Shipping Details" + "Free 30-day returns Details" rows w/ icons.
- Sticky Add-to-cart bar на mobile (collapses on scroll up).
- Tabs или accordion ниже: Description / Specs / Reviews / Related.
- States: out of stock (greyed-out size pill, не hidden), low stock indicator («Only 4 left»).
- AIDrawer остаётся доступным справа — позволяет вопросы про продукт inline.

**Priority: P0+.**

#### `CartScreen.js` — Cart

**Current:**
- 2-col: items list + summary.

**Redesign:**
- Item rows: image / title / variant / qty stepper / price / remove.
- Qty stepper — `<button>` +/- + `<input type="number">`.
- Remove button → toast «Removed. Undo (5s)».
- Summary card: subtotal / shipping estimate / tax / total.
- Primary CTA: «Proceed to checkout» — sticky на mobile, full-width.
- Empty state: «Your cart is empty. {Browse products →}»
- AI suggestion area (P2, future, см. ai-features-roadmap): «Bought this also bought…»

**Priority: P0.**

#### `Header.js` + `Footer.js`

**Header redesign (emox-style):**
- Row 1: `[Logo: e-shop/proshop wordmark]` `[SearchInput w/ AuroraBorder + ✨ prefix + clear×]` `[LocationIndicator: 📍 Delivering to X]` `[CountrySelector: 🇺🇸 US ▾]` `[Cart icon + count]` `[Sign In / Profile menu]`
- Row 2 (sub-nav, only on PDP / category pages): `[All Categories ▾]` `[Electronics] [Fashion] [Women's] ...` `[PromoBadge: Best Deals]` `[PromoBadge: Live ●]`
- Mobile: search bar collapses below logo row; sub-nav becomes horizontal scroll.
- Sticky на scroll.

**Footer redesign:**
- 3-column (desktop) / stack (mobile): About / Help / Legal.
- Trust signals: «Secure checkout · Free returns · X years in business».
- Phone + city для legitimacy.
- No 4-equal-column anti-pattern.

**AIDrawer (new, P0):**
- Right-side panel, 384px wide on desktop, full-width bottom-sheet on mobile.
- Composition: AIIdentityBadge header + close × button + conversation thread + GenerateImagesCard (или другое contextual CTA) + SuggestionChip row + AIPromptInput.
- Open state persisted across navigations (localStorage).
- Even if backend AI not ready — UI is mocked with static «Try asking…» state.

Все три — **P0**.

### P1 — week 2 (auth + checkout)

#### `LoginScreen.js` / `RegisterScreen.js`

**Current:** простая centred form.

**Redesign:**
- FormShell layout, max-w-md, centred.
- Email + password fields с visible labels.
- Password strength indicator (Register).
- Show/hide password toggle (`aria-pressed`).
- "Forgot password?" link.
- Server errors → form-level alert с focus management.
- Allow paste in password fields (WCAG 2.2 §3.3.8).
- Social login slots (future, не P1).

**Priority: P1.**

#### `ProfileScreen.js`

**Current:** form для update name/email/password + order history table.

**Redesign:**
- Tabs: Profile / Orders.
- Profile tab: name / email / change password section.
- Orders tab: order history с status badges (Paid / Shipped / Delivered).
- Empty state для orders: «You haven't placed an order yet. {Start shopping →}»

**Priority: P1.**

#### `ShippingScreen.js`

**Redesign:**
- Address autocomplete (через library or manual).
- Saved addresses (если будем добавлять).
- Visible field labels.
- Real-time validation (inline + descriptive).

**Priority: P1.**

#### `PaymentScreen.js`

**Redesign:**
- Payment method radio cards (PayPal / Stripe / Apple Pay).
- Security badges near submit, не footer.
- Card validation in real-time.

**Priority: P1.**

#### `PlaceOrderScreen.js`

**Redesign:**
- Review section: shipping address / payment method / order items / totals.
- Final CTA: «Place order, pay $84.50» (with amount).
- Trust line: «Secure payment · 30-day returns».

**Priority: P1.**

#### `OrderScreen.js` — Order confirmation/details

**Redesign:**
- Order number prominent (mono font).
- Status badge (Paid / Shipped / Delivered).
- Timeline component (placed → paid → shipped → delivered).
- Items table.
- Action buttons: «Track shipment», «Return items».

**Priority: P1.**

### P2 — week 3 (admin list screens)

#### `UserListScreen.js`

**Redesign:**
- Data table с sortable columns (name / email / admin status / created).
- Actions per row: Edit, Delete (with confirm modal).
- Search + filter.
- Pagination.
- Empty state.

**Priority: P2.**

#### `ProductListScreen.js`

**Redesign:**
- Same pattern as UserList.
- Bulk actions (если будем добавлять): export, delete, change status.
- «Create product» CTA top-right.

**Priority: P2.**

#### `OrderListScreen.js`

**Redesign:**
- Status filter chips top.
- Table with: order # / customer / date / total / status / actions.

**Priority: P2.**

### P3 — week 4 (admin edit screens + features)

#### `UserEditScreen.js`, `ProductEditScreen.js`

**Redesign:**
- FormShell + sections (basic info / advanced).
- Image upload (product) — drag-drop area + preview.
- Save/Cancel sticky buttons на bottom.
- Unsaved changes warning при navigation.

**Priority: P3.**

#### `FeatureFlagListScreen.js`

**Redesign:**
- Flag rows: name / description / state (toggle) / rollout % (slider или stepper).
- Confirm dialog before toggle на production flags.
- History log (если будет в backlog).

**Priority: P3.**

---

## Migration plan (D7 = in-place)

### Phase 0 — Foundation (week 0)

1. Install Tailwind 4 (если D2.b confirmed).
2. Create `frontend/src/styles/tokens.css` (импорт CSS vars из [`tokens.md`](tokens.md)).
3. Create `frontend/src/styles/globals.css` (Tailwind directives + base layer).
4. Add `data-theme` switcher на body.
5. Keep `bootstrap.min.css` import — postponing удаление.
6. Add `Design.md` to CLAUDE.md as required reading (см. cross-ref в Design.md).

### Phase 1 — P0 screens (week 1)

- Header, Footer (redesign as standalone components).
- HomeScreen + Product card.
- ProductScreen.
- CartScreen.
- One PR per screen для clean review.
- При каждом PR: дроп соответствующих react-bootstrap imports.

### Phase 2-4 — P1, P2, P3

Аналогично.

### Phase 5 — Cleanup

- Удалить `bootstrap.min.css` import из `index.js`.
- Удалить `react-bootstrap`, `react-router-bootstrap` из `package.json`.
- `npm run build` smoke test.
- Удалить `bootstrap.min.css` файл.

**NOTE:** AGENTS.md в proshop_mern говорит «Bootstrap is pinned — leave alone unless migrating UI framework wholesale». Сейчас именно этот случай — пользователь явно запросил редизайн, что подразумевает framework migration. **Обновить AGENTS.md** при старте Phase 1 — заменить "Bootstrap is pinned" на "Tailwind 4 + shadcn/ui (migrated 2026-05-XX), see Design.md".

---

## Component-to-shadcn mapping (если D2.b)

| Our component | shadcn/ui | Notes |
|---------------|-----------|-------|
| Button | `button` | 4 variants: default, secondary, ghost, destructive |
| Card | `card` | Composed: Card / CardHeader / CardContent / CardFooter |
| Input | `input` + `label` | Wrap in `<Field>` для consistency |
| Modal/Dialog | `dialog` | Radix under the hood — focus trap free |
| Toast | `sonner` (recommended) или `toast` | Sonner — better DX, single import |
| Skeleton | `skeleton` | One primitive, compose for cards/rows |
| Badge | `badge` | Variants for status |
| Tabs (PDP, Profile) | `tabs` | Accessible by default |
| Dropdown (Header user menu) | `dropdown-menu` | Radix-based |
| Form | `form` + react-hook-form + Zod | Standard shadcn pattern |
| Pagination | composed `button` w/ nav semantics | Or use `pagination` from shadcn examples |
| Carousel (Hero) | `carousel` (embla) | Built-in keyboard + pause |
| Table (admin lists) | `table` | Compose with `data-table` example |
| Tooltip | `tooltip` | Radix, instant a11y |

**shadcn pipeline (M4 canon):** для каждой секции — Steps 1-3 из [`shadcn-ux-structure-plan`](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/prompts/shadcn-ux-structure-plan.md) → [`shadcn-component-mapping`](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/prompts/shadcn-component-mapping.md) → [`shadcn-final-implementation`](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/prompts/shadcn-final-implementation.md).

---

## ASCII wireframes — placeholders

Каждая P0 screen получит ASCII wireframe до коде (M4 best practice — ascii-wireframe-lock pattern). Скетчи будут добавлены после закрытия D1 + просмотра visual references. Шаблон:

```
HomeScreen (desktop ≥1024px):
┌─────────────────────────────────────────────────────────────────┐
│ [Skip to content]                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Logo]  [Search……………………]   [Cart 3]  [Sign in]            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Hero carousel  ◀  ●○○  ▶  ⏸]                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│ │ Filters                  │  │ [Card] [Card] [Card] [Card]  │ │
│ │ Category   …             │  │ [Card] [Card] [Card] [Card]  │ │
│ │ Price      …             │  │                              │ │
│ │ Rating     …             │  │ [◀ Prev]  1 2 3  [Next ▶]   │ │
│ └──────────────────────────┘  └──────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Footer  About  Help  Privacy  Terms                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cross-refs

- Main: [`../../Design.md`](../../Design.md)
- Tokens: [`tokens.md`](tokens.md)
- A11y: [`accessibility.md`](accessibility.md)
- Motion: [`motion.md`](motion.md)
- Microcopy: [`microcopy.md`](microcopy.md)
- AI features (для AI chat / search / recommendations integration): [`ai-features-roadmap.md`](ai-features-roadmap.md)
- Anti-slop: [`anti-slop-guards.md`](anti-slop-guards.md)
