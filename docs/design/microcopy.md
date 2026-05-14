# Microcopy — UX writing patterns

> Раскрытие §12 из [`../../Design.md`](../../Design.md). Buttons / errors / empty / success / loading / form hints — конкретные строки и frameworks.

---

## Принципы

1. **Concrete > clever.** «Save shipping address» лучше «Submit».
2. **Acknowledge → explain → instruct** (Baymard error framework).
3. **No blame.** Не «You entered invalid email» → «Email doesn't look quite right. Try again.»
4. **Encouraging tone.** Empty state: «yet» suffix («No products yet») делает state временным.
5. **Specificity in trust.** Не «Trusted by thousands» → «Trusted by 12,400 customers since 2018».
6. **No "click here" / "learn more".** Каждая ссылка/кнопка описывает destination или action.
7. **Match channel.** Toast — терпит casual («Saved.»), error message — нет.

---

## Buttons & CTAs

### Primary actions

| Контекст | ❌ Generic | ✅ Concrete |
|----------|------------|--------------|
| Cart | Submit | Add to cart |
| Checkout step 1 | Next | Continue to payment |
| Checkout final | Place Order | Place order, pay $84.50 |
| Sign up | Submit | Create your account |
| Sign in | Submit | Sign in |
| Password reset | Submit | Send reset link |
| Save profile | Submit | Save changes |
| Delete confirm | OK | Delete user permanently |
| Cancel destructive | Cancel | Keep user account |
| Add to wishlist | + | Save for later |

### Secondary / ghost buttons

| Контекст | ✅ Copy |
|----------|---------|
| Continue browsing | Continue shopping |
| Back from cart | Back to cart |
| View details | View product |
| Apply filter | Show 24 results |
| Clear filters | Clear filters |
| Reset form | Reset all fields |

---

## Form labels & hints

### Inputs

| Field | Label | Hint (помещаем под field) | Autocomplete |
|-------|-------|---------------------------|--------------|
| Email | Email address | We'll send order confirmations here | `email` |
| Password | Password | At least 8 characters with a number | `current-password` / `new-password` |
| Full name | Full name | Matches the name on your card | `name` |
| Card number | Card number | 16 digits, no spaces needed | `cc-number` |
| CVV | Security code | 3 digits on the back of your card | `cc-csc` |
| Postal code | Postal code | We'll use this to calculate shipping | `postal-code` |
| Address line 1 | Street address | | `street-address` |
| City | City | | `address-level2` |
| Phone | Phone number | For delivery questions only | `tel` |

### Required indicator

```html
<label for="email">
  Email address
  <span aria-label="required" class="text-destructive">*</span>
</label>
```

Никогда не помечать optional как «(optional)» — это шум. Помечаем **required** через asterisk. Описание этого convention — в form-level помощи: «Fields marked * are required.»

---

## Errors — acknowledge / explain / instruct

**Framework (Baymard):**

1. **Acknowledge** — что произошло, кратко.
2. **Explain** — почему (если не очевидно).
3. **Instruct** — что сделать.

| Error | ❌ Bad | ✅ Good |
|-------|--------|---------|
| Required field empty | Required | Add your email to continue |
| Email invalid | Invalid email | Email doesn't look quite right. Try again. |
| Password too short | Invalid password | Use at least 8 characters with a number. |
| Card declined | Payment failed | Your card was declined. Try a different card or contact your bank. |
| Card expired | Invalid card | This card expired in 03/24. Use a different card. |
| Postal code mismatch | Error | This ZIP doesn't match the billing address on your card. |
| Out of stock | Unavailable | Sorry, this size just sold out. {linked: see other sizes} |
| Network failure | Something went wrong | We can't reach the server right now. Check your connection and try again. |
| Server 500 | Error | Something broke on our end. We're looking into it. Try again in a few minutes. |
| Login failed | Incorrect credentials | Email or password doesn't match our records. {linked: reset password} |
| 2FA wrong code | Wrong code | That code didn't work. Codes expire after 60 seconds, send a new one? |

### Form-level error summary

Когда form содержит несколько errors:

```jsx
<div role="alert" aria-live="assertive" className="error-summary">
  <h2>We couldn't process your order</h2>
  <ul>
    <li><a href="#field-card">Card number is incomplete</a></li>
    <li><a href="#field-cvv">Security code is missing</a></li>
  </ul>
</div>
```

Focus moves to summary heading on submit failure. Links scroll to fields.

---

## Empty states — formula

```
[Why it's empty] + [Clear next action]
```

| Context | ✅ Copy |
|---------|---------|
| Empty cart | Your cart is empty. {Browse products →} |
| No search results («keyword») | No matches for "{keyword}". {Adjust your search →} |
| No products in category | Nothing here yet. {Browse all categories →} |
| Filtered list empty | No items match these filters. {Clear filters →} |
| Empty order history | You haven't placed an order yet. {Start shopping →} |
| Admin: no users | No users yet. {Add the first user →} |
| Admin: no products | No products yet. {Add your first product →} |
| Admin: no orders | No orders yet. Once customers buy, orders show up here. |
| Inbox / notifications | All caught up. We'll let you know when there's something new. |

Rules:
- Under 15 words.
- Always next-action.
- Encouraging tone for first-use («yet»).
- Specific for filter / search («no matches for X», не «no matches»).
- Visual element optional, никогда не вместо копии.

### Layout pattern

```
[48px muted icon]
[h4 muted]   No products yet
[body sm muted]   Browse the catalog to add your first item
[secondary button]   Browse products
```

---

## Success states / confirmations

| Context | ✅ Copy |
|---------|---------|
| Order placed | Order placed. We'll email you a confirmation in a moment. |
| Item added to cart | Added to cart. {Cart total: $84.50} |
| Profile saved | Your changes are saved. |
| Password updated | Password updated. You'll be signed out of other devices. |
| Email sent | Reset link sent. Check your inbox in a minute. |
| Item removed (with undo) | Removed. {Undo (5s)} |

Auto-dismiss OK для confirmations, **не** для errors. Если success требует чтения деталей (например, order number) — non-dismissable.

---

## Loading states

| Context | ✅ Copy / Pattern |
|---------|-------------------|
| Page initial load | (no copy, just skeleton) |
| Form submit | Button label → "Placing order…" + `aria-busy="true"` |
| Search typing | (debounced, no copy, skeleton results) |
| Cart updating qty | (no copy, optimistic update + skeleton in totals) |
| Slow operation (>3s) | "This usually takes about 10 seconds…" |
| Timeout warning (>20s) | "Still working… {Cancel} {Keep waiting}" |

---

## Trust signals & policy snippets

### Near Add to Cart

```
Free returns within 30 days · Ships in 24h · 4.8 ★ from 2,400+ reviews
```

Inline benefit line на одной строке, separated by ` · `. Не три отдельных строки.

### Near payment fields

```
🔒 Secure checkout · We don't store your card number · {Privacy policy}
```

(SVG icon, не emoji в продакшне)

### Footer / About page

- Specific numbers («Customers in 47 countries», «5,000+ orders shipped»).
- Real address with city, не только PO box.
- Phone with country code.
- Named human contact для small businesses («Reach Sergey directly: sergey@…»).

---

## Date / number formats

- **Dates:** «May 14, 2026» (en-US), «14 мая 2026» (ru-RU). Использовать `Intl.DateTimeFormat`.
- **Currency:** «$84.50», «1 200 ₽» — locale-aware через `Intl.NumberFormat`.
- **Order numbers:** monospace font, uppercase prefix («ORD-2026-00482»).
- **Relative time** для recent events: «3 minutes ago», «yesterday». Absolute date для everything older.

---

## Tone modifiers per audience

| Audience | Tone |
|----------|------|
| Customer-facing (cart, checkout, account) | Warm, professional, no slang |
| Admin / dashboard | Direct, less warmth, more density |
| Errors (any audience) | Calm, helpful, no exclamation marks |
| Marketing copy (hero, landing) | Bolder, value-driven, still no exclamation |

**Никаких exclamation marks** в interface copy. «Welcome back!» → «Welcome back». Удивление = шум.

---

## Banned phrases

- «Click here»
- «Learn more» (sole link text — OK как aria-label only если visible text contextual)
- «Submit»
- «Something went wrong. Please try again later.» (generic, useless)
- «Are you sure?» without context («Are you sure you want to delete X? This cannot be undone.» — OK)
- «Oops!» / «Whoops!»
- «We are committed to…»
- «Award-winning», «cutting-edge», «innovative», «seamless» (vague marketing fluff)

---

## Localization readiness

Even в учебном demo — соблюдаем правила, потому что любые copy могут стать translatable string:

- Все строки — через i18n keys (`t('cart.empty.title')`), не inline.
- Plural-aware (`{count, plural, one {# item} other {# items}}`).
- Date / number — через `Intl.*`, не hardcoded.
- Avoid composing sentences через string concatenation. Полный предложения в i18n keys.

---

## Sources

- Baymard Institute error framework (acknowledge / explain / instruct).
- Mintlify UX Writing skill — empty state formula.
- Shopify «How to write microcopy that influences» 2026 update.
- 137Foundry «Designing error messages and empty states» 2026-05.

---

## Cross-refs

- Main: [`../../Design.md`](../../Design.md)
- A11y (form labels, error linking): [`accessibility.md`](accessibility.md)
- Components (button labels, input states): [`screen-inventory.md`](screen-inventory.md)
