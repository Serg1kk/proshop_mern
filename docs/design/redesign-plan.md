# Good Shop Redesign Plan — remaining 15 screens

> Companion to `screen-inventory.md`. Concrete migration plan for every
> proshop_mern screen that isn't HomeScreen (which is already shipped on
> the aurora-commerce Preset D system).
>
> Stack target: drop Bootstrap progressively, every page wrapped in `.gs-root`
> and consuming `styles/tokens.css` + `styles/base.css` + `styles/components.css`.

---

## Migration strategy

### Phases

| Phase | Scope | Reason to batch this way |
|---|---|---|
| **P0 (done)** | HomeScreen — `.gs-root` shell, GsHeader, GsFooter, ProductCard, FilterChip, BrandCard, HeroBanner | Anchor — locks tokens/signature elements in real React code |
| **P1** | Shared layout: move `GsHeader` + `GsFooter` to App-level for routes opted-in; build shared atoms (`Button`, `Input`, `Field`, `Alert`, `Skeleton`, `EmptyState`, `Breadcrumb`, `Badge`, `Stepper`) | Eliminates duplication; downstream pages compose, don't re-style |
| **P2** | Storefront read-paths: `ProductScreen`, `CartScreen` | Highest user-visible value; reuses ProductCard, PriceLockup, Rating |
| **P3** | Auth: `LoginScreen`, `RegisterScreen` | Tiny pages, validate forms pattern |
| **P4** | Checkout: `ShippingScreen`, `PaymentScreen`, `PlaceOrderScreen`, `OrderScreen` | Forms + CheckoutProgress + payment flow |
| **P5** | Account: `ProfileScreen` | Reuses form + order-table patterns |
| **P6** | Admin: `UserListScreen`, `UserEditScreen`, `ProductListScreen`, `ProductEditScreen`, `OrderListScreen`, `FeatureFlagListScreen` | Lower priority; dense table-heavy pages |
| **P7** | Cleanup: uninstall `react-bootstrap`, `react-router-bootstrap`, delete `bootstrap.min.css`, remove `react-paypal-button-v2` styling overrides | Only safe once P2–P6 ship |

### Layout decisions

1. **All non-Home screens render inside `<GsHeader>` + `<main className="page">` + `<GsFooter>`**. The new App.js `Switch` branch keeps the old Bootstrap shell for any screen not yet migrated — flip a route from old branch to new branch when its screen is ready.
2. **No more `<Container>`**. The `.page` selector caps to 1600px and pads; forms use a centred narrow shell (`max-width: 560px`) via a new `<FormShell>`.
3. **Forms get a single `<Field label="" hint="" error="">` wrapper** with floating focus ring, error microcopy below, and pill-radius inputs (`--radius-pill` for buttons, `--radius-md` for inputs). All inputs ≥ `--target-primary` (44px).
4. **Data tables** become `<DataTable>` — sticky header, zebra `var(--surface-tinted)` rows, action buttons rendered as `.btn.is-ghost` chips.
5. **Empty states** are mandatory on all index views (cart, orders, users, products, features). `<EmptyState>` ⇒ icon + headline + sub + primary CTA.
6. **Toasts** replace Bootstrap `Message` for transient feedback (cart add, save success). Persistent banners stay as `<Alert>`.

### Shared atoms to build before P2

Located in `frontend/src/components/good-shop/`. Already in P0: `Sparkle`, `Stars`, `PriceLockup`, `HeartIcon`, `Placeholder`, `ProductCard`, `FilterChip`, `BrandCard`, `HeroBanner`, `GsHeader`, `GsFooter`. New atoms below.

| Atom | Variants | Notes |
|---|---|---|
| `Button` | `is-primary`, `is-secondary`, `is-ghost`, `is-outline`, `is-destructive`, `is-lg`, `is-sm`, `is-loading`, `is-block` | Wraps `.btn` styles; `disabled` ⇒ visually muted, not aurora |
| `Input` | text/email/password/number/textarea/select | All driven by `<Field>`; pill radius, focus ring |
| `Field` | normal, error, disabled | Composes Label + Input + Hint + Error; `aria-describedby` wired |
| `Alert` | info, success, warning, destructive | `role="alert"` mandatory; icon left, dismiss optional |
| `Skeleton` | text-row, card, image, table-row | Uses `--card` background + drift animation; reduced-motion → solid |
| `EmptyState` | default, compact | Centred, max-w-md, optional illustration slot |
| `Breadcrumb` | — | Each crumb is a Link except current `aria-current="page"` |
| `Badge` | neutral, success, warning, destructive, info | For order status, stock pills |
| `Stepper` | qty (+/-) | Used in cart; `aria-label="Quantity"` |
| `CheckoutProgress` | 4-step | Sign-in / Shipping / Payment / Place order; ✓ done / dot current / line upcoming |
| `DataTable` | normal, dense | Wraps `<table>` with `.gs-table` class; column align hints |
| `Toast` | info, success, destructive | Live region top-right; auto-dismiss 4s |
| `Modal` | sm, md, lg | Focus-trap, ESC-close, `role="dialog"` |
| `FormShell` | narrow (560px), wide (760px) | Wraps section + heading + Field stack |

---

## Per-screen plans

For each: route, baseline (current), target (new), components, tokens, signature, microcopy, a11y, edge cases.

---

### 1. ProductScreen — `/product/:id`

**Baseline.** 3-column `Row/Col` from react-bootstrap. Image left, details middle, add-to-cart card right. ListGroup for rating/price/stock, no reviews UI grouping, plain `<form>` for reviews.

**Target.**
- 2-column layout above the fold: large image gallery (left, 60% width) + sticky purchase card (right, 40%, sticks to top with `position: sticky; top: 96px`).
- Breadcrumb above content: `Home › {Category} › {Brand} › {Product name}`.
- Hero title H1 + `Stars value=… count=…` + `PriceLockup is-lg` (large variant).
- Description in `<dl>` with subtle dividers.
- **Reviews section below** with: average rating widget, distribution bars (5★ — XX%), individual review cards in 2-col grid.
- **Add review** as inline form (not in side card) — only visible when `userInfo` is truthy; otherwise CTA "Sign in to leave a review".

**Components.** `Breadcrumb`, `Placeholder` (image), `Stars`, `PriceLockup`, `Button` (Add to cart), `Stepper` (qty), `Badge` (in-stock/out-of-stock), `Alert` (review post error/success), `Field` (rating select + comment textarea), `Card` (review card).

**Signature.** AuroraBorder `.is-subtle` around the purchase card to draw attention. AuroraBorder `.is-static` on the **selected** thumbnail (if gallery has multiple images — currently only one, but skeleton ready).

**Tokens.** All from Preset D. Stock badge: `--success` (in stock) / `--destructive` (out). Buy CTA: `--primary` filled, `.is-lg` (56px).

**Microcopy.**
- Out-of-stock: «Sold out — notify me» (button, ghost).
- In-stock low: «Only N left».
- Add-to-cart success toast: «Added to cart».
- Review form placeholder: «What did you think of the fabric, fit and shipping?»
- Review post error: «We couldn't post your review. Try again in a moment.»

**A11y.** `<main aria-labelledby="product-h">`, gallery `<button>` thumbs with `aria-pressed`, Stepper +/− buttons `aria-label="Increase quantity"/...`, Stars `role="img" aria-label="…"`, Review form labelled, post button `aria-busy={loading}`.

**Edge cases.** Loading → 2-col skeleton; error → `<Alert variant="destructive">`; not-found → `<EmptyState>` with "Browse all products" CTA.

---

### 2. CartScreen — `/cart/:id?`

**Baseline.** Two `Col`s — left ListGroup of cart items, right small order summary card. Quantity is a `<Form.Control as="select">`.

**Target.**
- 2-column at desktop, stacks at mobile. Left: stacked cart-item rows. Right: sticky `<OrderSummary>` (subtotal, shipping note, tax estimate, big `Proceed to checkout` CTA).
- Each cart item row: thumb (80×80, `.ph`), title + variant meta, `<Stepper>`, `<PriceLockup>`, `Remove` ghost button.
- Above list: «N items in your bag» count + «Continue shopping» link.
- **Empty state** when no items: illustration slot, «Your bag is empty», CTA «Browse the home page».
- Sticky mobile checkout bar at bottom: `position: fixed; bottom: 0; w-full; backdrop-blur` — subtotal + Checkout CTA visible at all times.

**Components.** `ProductCard` row variant (new sub-variant `.product-card.is-row`), `Stepper`, `PriceLockup`, `Button`, `EmptyState`, `Toast` (item removed), `Skeleton` (rows).

**Signature.** AuroraBorder `.is-static` around the right `OrderSummary` card.

**Tokens.** Sticky mobile bar: `background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); border-top: 1px solid var(--border-subtle); padding: var(--space-3) var(--space-4)`.

**Microcopy.**
- Empty: «Nothing here yet.» / «Browse the home page» CTA.
- Remove confirm (toast with undo): «Removed. Undo».
- Shipping note: «Free shipping on orders over $50».

**A11y.** Cart item region `aria-label="Cart item: {name}"`; Stepper `aria-valuemin/max/now`; Remove button `aria-label="Remove {name} from cart"`; sticky checkout bar `role="region" aria-label="Cart summary"`.

**Edge cases.** Out-of-stock cart item: dim, show `Badge variant="destructive"` "No longer in stock", block checkout, hint user.

---

### 3. LoginScreen — `/login`

**Baseline.** `FormContainer` (max-w-md), `Form.Group`s, single submit, "New customer?" link.

**Target.**
- Centred `<FormShell width="narrow">` over `.gs-root` page background.
- H1 «Welcome back» + sub «Sign in to continue».
- Two Fields (email, password). Password field has eye toggle (show/hide).
- Primary `is-lg` button «Sign in».
- Below: «Forgot password?» link, divider, «New here? Create account» link.
- **No social/Google option in scope yet** (out of project), but layout leaves room — comment slot in JSX.

**Components.** `FormShell`, `Field`, `Input`, `Button`, `Alert` (login error).

**Signature.** AuroraBorder `.is-subtle` around the entire FormShell card.

**Microcopy.**
- Email placeholder: removed (label suffices).
- Password hint: «Use 8+ characters with letters and numbers».
- Error: «Email or password didn't match. Please try again.»

**A11y.** Form `aria-labelledby="login-h"`, password toggle button `aria-pressed`, `aria-label="Show password"/"Hide password"`. Submit `aria-busy={loading}`. Alert above form with `role="alert"`.

**Edge cases.** Server 500 → `Alert variant="destructive">«Something went wrong on our end. Try again.»`. Already authenticated → `<Redirect to={redirect || '/'} />` preserved.

---

### 4. RegisterScreen — `/register`

**Baseline.** Same as Login but with name + confirm-password.

**Target.**
- Mirror Login. Title «Create your account».
- 4 Fields: name, email, password, confirm password.
- Live inline validation on confirm (matches/doesn't).
- Below: «By creating an account you agree to ... » + links to Terms / Privacy (static for now).
- Already-have-account link.

**Components.** Same as Login + `Alert` for mismatch.

**Microcopy.**
- «Use 8+ characters with letters and numbers» (live hint).
- Mismatch error: «Passwords don't match yet.»
- Generic error: «We couldn't create your account. Try a different email.»

**A11y.** Same patterns as Login; inline validation uses `aria-invalid="true"` and `aria-describedby` to error text.

---

### 5. ShippingScreen — `/shipping`

**Baseline.** FormContainer with CheckoutSteps Nav at top (step 2 active).

**Target.**
- `<FormShell width="narrow">` + `<CheckoutProgress current={2} />` ABOVE the shell.
- H2 «Where should we send it?» (less generic than «Shipping»).
- Address field (street), then a 3-col grid: city / postal / country.
- Country dropdown uses `<Field>` `<Input as="select">` — for now hard-coded US/CA/UK; comment notes "swap for a real country picker later".
- Bottom CTA bar: «Continue to payment» (primary, is-lg, full width).

**Components.** `CheckoutProgress`, `FormShell`, `Field` × 4, `Button`.

**Signature.** AuroraBorder `.is-subtle` around CheckoutProgress strip — signals "guided flow".

**Microcopy.**
- «We deliver to physical addresses only.» (under address label).
- Continue button: «Continue to payment».

**A11y.** Fieldset around the 3-col grid with `<legend>City, postal code, country</legend>` for screen readers, even if visually hidden.

**Edge cases.** No saved shipping address → starts blank. Pre-fill from `cart.shippingAddress` (existing Redux) when user navigates back.

---

### 6. PaymentScreen — `/payment`

**Baseline.** Radio group: PayPal / Stripe (deprecated). FormContainer.

**Target.**
- Same `<FormShell>` + `<CheckoutProgress current={3} />`.
- Title «How will you pay?»
- Radio-card list (not Bootstrap radio): each option is a clickable card showing method icon + name + sub-copy. PayPal active by default.
- **No actual card form** — Stripe out of scope; show only PayPal (existing integration) and a disabled card-tile «Card · Coming soon».

**Components.** `RadioCard` (new — card variant of input), `Button`, `CheckoutProgress`.

**Signature.** Selected RadioCard gets AuroraBorder `.is-static`.

**Microcopy.**
- PayPal sub: «You'll be redirected after Place order.»
- Card sub: «Coming soon — saved cards and Apple Pay».
- Continue: «Review your order».

**A11y.** RadioGroup `role="radiogroup" aria-labelledby="payment-h"`; each card `role="radio" aria-checked` and keyboard-navigable with arrow keys.

---

### 7. PlaceOrderScreen — `/placeorder`

**Baseline.** 2-col: left has 3 ListGroups (shipping/payment/items review); right has totals card with PayPal button.

**Target.**
- 2-col, sticky right summary (like Cart). `<CheckoutProgress current={4} />` at top.
- Left section uses 3 `<ReviewBlock>` cards (new — title + edit-link + content). Edit links go back to /shipping, /payment.
- Right summary repeats items count, subtotal, shipping, tax, total, place-order CTA. Place-order CTA is `is-lg`, full width, with aurora border `.is-subtle`.
- Order error → `<Alert variant="destructive">` above summary.

**Components.** `ReviewBlock` (new), `OrderSummary`, `Button`, `Alert`, `Skeleton` (during create).

**Signature.** AuroraBorder `.is-subtle` around the Place-order CTA — final commit moment, aurora draws eye.

**Microcopy.**
- Block titles: «Shipping to», «Paying with», «You're ordering».
- Edit link: «Change».
- Place order: «Place order» (no exclamation).

**A11y.** Section landmarks (`<section aria-labelledby="review-shipping-h">` etc.). Place-order button `aria-busy={creating}`.

**Edge cases.** Out-of-stock check during placement: if backend rejects, navigate user back to cart with toast.

---

### 8. OrderScreen — `/order/:id`

**Baseline.** Confirmation + PayPal sandbox button (if not paid) + ListGroups for shipping/payment/items.

**Target.**
- Hero strip at top: success illustration slot + H1 «Thanks, your order is in» + small order #ID. If unpaid: H1 «One step left to confirm» + Pay now CTA.
- `<Badge>` row: Paid · Shipped · Delivered (each is a status pill, current state highlighted).
- Below: `<ReviewBlock>` × 3 (Shipping, Payment, Items) reusing PlaceOrder pattern.
- Right column: small `OrderTotals` card + PayPal button if unpaid.
- Admin view (`userInfo.isAdmin`): `Mark as delivered` ghost button at bottom.

**Components.** `Badge`, `ReviewBlock`, `Button`, `Alert`, `PayPalButton` (existing).

**Signature.** Status pills use `.aurora-border.is-subtle` only on the **current** step — signals progress.

**Microcopy.**
- Unpaid: «You'll receive a confirmation email after payment.»
- Paid: «We'll email you when it ships.»
- Delivered: «Hope you love it. Tap an item to leave a review.»

**A11y.** Status pills `aria-current="step"` on current state. PayPal button container `role="region" aria-label="Payment options"`.

---

### 9. ProfileScreen — `/profile`

**Baseline.** 2-col: left profile form (name/email/password/confirm), right Order list table.

**Target.**
- Page top: `<Breadcrumb>` and H1 «{User's name}» + small subtitle email.
- 2-col: left `<FormShell>` for "Update profile", right `<DataTable>` for orders.
- Profile form same Field pattern. Save toast on success.
- Orders table columns: ID (short), Date, Total (PriceLockup), Paid (Badge), Delivered (Badge), Actions (ghost button «View»).
- Empty state if no orders.

**Components.** `Breadcrumb`, `FormShell`, `Field` × 4, `Button`, `Toast`, `DataTable`, `Badge`, `EmptyState`.

**Signature.** AuroraBorder `.is-subtle` around profile form when editing.

**Microcopy.**
- Save success: «Profile updated.»
- Order action link: «View order».

**A11y.** Two `<section>` landmarks side by side, each with own `aria-labelledby`. Table caption hidden but present: «Order history».

---

### 10. UserListScreen — `/admin/userlist`

**Baseline.** Plain table with `<Button variant="light">` icons for edit/delete.

**Target.**
- Header bar: H1 «Users» + counter «{N} users» + search input (filter by name/email — client-side). Admin pages share an `AdminHeader` mini-layout (could become own pattern).
- `<DataTable>` cols: Avatar (initials in a 32px disk, `--card`), Name, Email, Admin (`Badge`), Joined (formatted date), Actions (Edit ghost button, Delete destructive ghost button).
- Bulk select column when more than 10 users — for now mark as P7 future.
- Delete uses `<Modal>` confirm dialog.

**Components.** `DataTable`, `Badge`, `Button` (ghost + destructive), `Modal`, `Input` (filter), `EmptyState`.

**Microcopy.**
- Modal title: «Delete this user?»
- Modal body: «They'll lose access immediately. This can't be undone.»
- Modal CTA: «Delete user» (destructive).

**A11y.** Filter input has visible label «Search users». Sort headers (date asc/desc) are buttons with `aria-sort`.

---

### 11. UserEditScreen — `/admin/user/:id/edit`

**Baseline.** FormContainer with name/email/isAdmin toggle.

**Target.**
- `<Breadcrumb>` Users › {User name}.
- `<FormShell width="narrow">` with 3 Fields: name, email, isAdmin (toggle switch, not checkbox).
- Save toast.

**Components.** `Breadcrumb`, `FormShell`, `Field`, `Toggle` (new — switch styled), `Button`, `Toast`.

**Microcopy.** Toggle label: «Administrator privileges». Sub: «Can manage products, orders and other users.»

**A11y.** Toggle = `<button role="switch" aria-checked>`.

---

### 12. ProductListScreen — `/admin/productlist`

**Baseline.** Table of products with edit/delete buttons; «Create Product» button creates blank and redirects to edit.

**Target.**
- Header bar: H1 «Products» + count + search + «Create product» primary CTA.
- `<DataTable>` cols: Image (32px ph), Name (link to /product/:id), Brand, Category, Price (PriceLockup), Stock (Badge color-coded: ≥10 success, 1-9 warning, 0 destructive), Actions.
- Create flow: clicking «Create product» opens a `<Modal>` with name field → on save, POST then redirect to ProductEditScreen. (Improves on current «creates and immediately redirects» — less surprise.)

**Components.** `DataTable`, `Badge`, `Button`, `Modal`, `Input`, `EmptyState`, `PriceLockup`.

**Microcopy.**
- Create modal: title «New product», body «You can fill in the rest on the next screen.»
- Stock badge: «X in stock» / «Sold out».

**A11y.** Create-product button autofocuses modal name input. ESC closes modal.

---

### 13. ProductEditScreen — `/admin/product/:id/edit`

**Baseline.** Long single-column form with all product fields, image upload via separate `<Form.File>`.

**Target.**
- Two-section layout. Left 60%: Form (`<FormShell width="wide">`) with sections grouped: Identity (name, brand, category), Pricing & stock (price, count), Media (image upload), Description (textarea). Each section is a `<FormSection>` with its own H3.
- Right 40%: sticky `<ProductPreview>` panel — shows live ProductCard as user types, so admin sees how it'll look on Home. Persistent feedback loop.
- File upload widget: drag-and-drop, accepts JPG/PNG, shows preview thumbnail.
- Save: bottom-bar with «Cancel» (ghost) + «Save changes» (primary). Discard confirm via Modal if dirty.

**Components.** `FormShell`, `FormSection` (new), `Field` × N, `FileUpload` (new — drag-drop wrapper), `ProductCard` (re-use, live preview), `Button`, `Modal` (discard confirm), `Toast`.

**Signature.** Live preview ProductCard uses real ProductCard from good-shop/ — keeps consistency.

**Microcopy.**
- Field hints: «Description supports markdown.» (if true), «Price in USD».
- Save: «Save changes». Cancel: «Discard».
- Discard modal: «Discard unsaved changes?»

**A11y.** Form sections are `<section aria-labelledby="…">`. File upload has visible label and accepts keyboard input. Save button `aria-busy={saving}`.

---

### 14. OrderListScreen — `/admin/orderlist`

**Baseline.** Plain table: ID, user, date, total, paid, delivered, Details button.

**Target.**
- Header bar: H1 «Orders» + count + filter chips (`<FilterChip>` reuse): Status (paid/unpaid/delivered), Date range (today/7d/30d/all).
- `<DataTable>`: ID (short), Customer (name + email small), Date, Total (PriceLockup), Status (badge stack: Paid · Delivered), Action (View).
- Empty state if filter returns nothing.

**Components.** `DataTable`, `FilterChip`, `Badge`, `Button`, `PriceLockup`, `EmptyState`.

**Microcopy.**
- Filter chip default labels match Home: «Status», «Date range».
- Status badges: «Paid», «Awaiting payment», «Delivered», «Shipped».

**A11y.** Filter bar `role="toolbar" aria-label="Filter orders"` — same pattern as HomeScreen.

---

### 15. FeatureFlagListScreen — `/admin/features`

**Baseline.** Table of flags with toggle buttons for state, rollout percent input.

**Target.**
- Header bar: H1 «Feature flags» + count + search.
- `<DataTable>` cols: Flag key (mono font, `--font-mono`), Description, State (Toggle switch — off / testing / on), Rollout % (slider 0–100), Updated by (small), Actions.
- Each row is "live editable" — toggling state or moving slider POSTs immediately, shows inline `<Toast>` confirmation.
- A `<Banner>` (new — `Alert` variant) at top: «Changes apply on next page load for end users».

**Components.** `DataTable`, `Toggle`, `Slider` (new — single-handle range, gradient track), `Toast`, `Alert` (banner).

**Signature.** Slider track uses `var(--aurora-gradient)` from 0 to current value — fits the brand and makes percentage feel premium.

**Microcopy.**
- State labels: «Off», «Testing», «On».
- Banner: «Changes apply on next page load for end users.»
- Rollout aria-label: «Rollout percent for {flag.key}».

**A11y.** Slider = `<input type="range">` with visible label + numeric display + `aria-valuetext="X percent"`.

---

## Cross-cutting concerns

### Routing & navigation

- Update `App.js` Switch progressively: as each screen ships in `gs-root`, move its route from the legacy branch (with `<Header>` + `<Container>` + `<Footer>`) to a new `<Route>` that just renders the screen (the screen owns its own GsHeader/GsFooter wrapper).
- When all 15 ship: collapse `App.js` to a single Switch with no legacy branch, delete `components/Header.js`, `components/Footer.js`, `components/Product.js`, `components/Paginate.js`, `components/Rating.js`, `components/SearchBox.js`, `components/CheckoutSteps.js`, `components/FormContainer.js`, `components/Loader.js`, `components/Message.js`, `components/ProductCarousel.js`.

### Removing Bootstrap

Do **not** delete `bootstrap.min.css` import until all 15 screens have shipped and `git grep "from 'react-bootstrap'"` returns nothing in `frontend/src/`. P7 cleanup:

```bash
# After all screens migrated:
grep -r "from 'react-bootstrap'" frontend/src/
grep -r "from 'react-router-bootstrap'" frontend/src/
# Both must return nothing.

# Then:
sed -i '' "/import '\.\/bootstrap\.min\.css'/d" frontend/src/index.js
rm frontend/src/bootstrap.min.css
cd frontend && npm uninstall react-bootstrap react-router-bootstrap
```

### Testing strategy per page

The proshop_mern AGENTS.md says: "if you change observable output, write a characterization test first." Practical version for visual redesign:

1. **Before migrating a screen**: take a Playwright screenshot of the old version at `tests/visual/{screen}-before.png`.
2. **After migrating**: take a screenshot at `tests/visual/{screen}-after.png`.
3. **Manual diff**: open both side by side; ensure no functional regressions (forms still submit, links still navigate, Redux actions still dispatch).
4. **Once stable**: keep `-after.png` as baseline for future regressions.

For data-layer or behavior verification: hit the same routes with cURL or use existing Redux actions in screen — they don't change, only the DOM does.

### Accessibility audit checklist (apply to every screen)

Per `accessibility.md`:

- [ ] All interactive ≥ 44×44px touch target (WCAG 2.5.8). Buttons height 40–56, inputs 44.
- [ ] Focus visible: every focusable shows `outline: 2px solid var(--ring)` on `:focus-visible`.
- [ ] Skip link present (one per page; we have one in HomeScreen already — adapt for others).
- [ ] Form labels visible (never placeholder-only).
- [ ] Errors `aria-describedby`-linked to inputs.
- [ ] Status messages live (`role="alert"` for errors, `aria-live="polite"` for toasts).
- [ ] Reduced motion respected (aurora animations, live-pulse, skeleton shimmer all disable).
- [ ] Color contrast ≥ 4.5:1 for body text against background.

### Brand tokens

All from `docs/design/tokens.md` Preset D. **No new tokens needed** for the 15 redesigns unless we add dark mode (out of scope this pass — `screen-inventory.md §current problems` lists it as a known gap).

### Imagery policy

`Placeholder` component currently shows `src || ph-label`. Real product images load from `/uploads/{name}.jpg`. If a product has no image: `.ph` placeholder with `ph-label = product.name` — already wired in `ProductCard.js`. No design-time mock placeholders needed for migrated screens.

---

## Suggested order of work (if you ask me to start P1)

1. Build the shared atoms first (P1) — `Button`, `Field`, `Alert`, `EmptyState`, `Skeleton`, `Badge`, `Breadcrumb`, `CheckoutProgress`, `Modal`, `Toast`, `Stepper`, `DataTable`, `FormShell`. ~1 day.
2. ProductScreen + CartScreen (P2). ~1 day. Highest leverage.
3. Login + Register (P3). Half day.
4. Checkout flow Shipping → Payment → PlaceOrder → Order (P4). 1 day.
5. Profile (P5). Half day.
6. Admin pages (P6). 1.5 days for all 6.
7. Cleanup pass (P7). Half day.

**Total estimate: ~5–6 working days** of focused implementation, assuming the React+Redux plumbing stays as-is (no state shape changes).

---

## Out of scope for this plan

- **Dark mode** — design tokens (`--background`/`--foreground` swaps) are ready, but a controlled `[data-theme="dark"]` palette needs to be defined and Codex'd. Track in `ai-features-roadmap.md` § "Theme variants" as a separate piece of work.
- **Real AI Drawer / Chat** — explicitly removed from the Home prototype per user request. Re-introduce later when the feature exists (see `screen-inventory.md §emox-specific` for components).
- **Mobile bottom-nav** — current responsive plan stacks the header instead of switching to a bottom tab bar. Bottom-nav is a separate UX call.
- **i18n** — copy currently English. RU/EN switch is its own feature.
- **Real Stripe / Card payments** — out of scope; PaymentScreen keeps PayPal-only with placeholder.

---

*Last updated: 2026-05-14, alongside design.md sync from Claude Design.*
