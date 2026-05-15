# Accessibility — WCAG 2.1 AA + 2.2 deltas для proshop_mern

> Раскрытие §9 из [`../../Design.md`](../../Design.md).
>
> **Target:** WCAG 2.1 Level AA по умолчанию + 6 новых AA criteria из WCAG 2.2.
> **AAA** — селективно, где даёт реальный UX-выигрыш.
> **Compliance scope:** ADA Title III (private commerce), EAA (European Accessibility Act effective 2025-06-28 для EU).

---

## Why this matters (для учебного demo)

proshop_mern — учебный fork, не shipping product. Но a11y критично для M4-курса по двум причинам:

1. **AI-агенты по умолчанию забивают на a11y.** Студенты на своих демо-проектах должны увидеть полный паттерн «accessibility by construction» — иначе после курса они продолжат шипить inaccessible UI.
2. **Реальные e-commerce lawsuit-стат в 2025-2026.** Domino's, Target, Beyoncé — все проиграли ADA-иски по сайту. WCAG 2.2 AA — общепринятый юридический standard.

---

## Принципы (POUR + practical)

| Principle | Что обеспечивает | E-commerce failure mode |
|-----------|------------------|--------------------------|
| **Perceivable** | Контент воспринимаем хоть одним sense | Низкий contrast на CTA → юзер не видит "Add to cart" |
| **Operable** | Юзер может взаимодействовать | Mouse-only drag для image zoom → motor-impaired не могут |
| **Understandable** | Юзер понимает интерфейс и предсказывает поведение | Form errors без объяснений → юзер уходит |
| **Robust** | AT может корректно интерпретировать контент | Custom `<div role="button">` без keyboard → screen reader не активирует |

---

## WCAG 2.2 — 6 новых AA criteria, обязательные для proshop_mern

Все 6 — checks обязательны для каждого нового компонента в редизайне.

### 2.4.11 Focus Not Obscured (Minimum) — AA

**Что:** focused element не должен быть полностью скрыт sticky-элементами (header, banner, cookie consent, chat widget).

**E-commerce контекст:** sticky Navbar `<Navbar>` в `Header.js` сейчас может перекрывать focused инпуты на длинных страницах (ProductScreen, OrderScreen).

**Fix:**

```css
html {
  scroll-padding-top: 80px; /* высота sticky header + breathing room */
}
```

Plus при `scrollIntoView()` всегда передавать `{ block: 'center' }`.

**Test:** Tab через всю страницу — каждый focused element полностью виден.

### 2.5.7 Dragging Movements — AA

**Что:** для каждого drag-required interaction должна быть single-pointer альтернатива.

**E-commerce контекст:**
- `ProductCarousel.js` — swipe gestures должны дублироваться prev/next buttons.
- Если добавим image zoom drag — нужны +/- buttons или click-to-zoom.
- Quantity slider в cart — не использовать drag-only, использовать stepper buttons.

### 2.5.8 Target Size (Minimum) — AA

**Что:** interactive targets ≥ 24×24 CSS pixels. Exceptions: inline text links (any size), user-agent controls.

**Recommendation для proshop_mern:** primary actions (Add to Cart, Checkout, Sign In, Submit) — **44×44px** (Apple HIG, рекомендация для тач-устройств). Меньшие targets — 24×24 минимум.

**Tokens** (canonical source: [`tokens.md#touch-target-tokens`](tokens.md#specific-component-sizing-for-preset-d)):

```css
:root {
  --target-min:     24px; /* WCAG 2.2 minimum */
  --target-default: 40px; /* button height в нашей системе */
  --target-primary: 44px; /* primary actions, sticky buy bars */
}
```

**Fix для существующего proshop_mern:** «Remove» иконки в `CartScreen.js`, quantity steppers — поднять с дефолтных Bootstrap размеров до min 24×24, primary — до 44×44.

### 3.2.6 Consistent Help — A

**Что:** help-механизмы (контактные формы, FAQ link, chat) появляются в одинаковом месте на каждой странице (если присутствуют).

**Fix:** Footer.js должен иметь стабильный help block («Need help? Contact support») на всех страницах. Не показывать иногда в Header, иногда в Footer.

### 3.3.7 Redundant Entry — A

**Что:** информация которую юзер ввёл в одном шаге form, не запрашивается снова в том же flow.

**E-commerce контекст:** в проде checkout flow (Shipping → Payment → PlaceOrder) — `Email` собирается на Shipping, не должен пере-запрашиваться на Payment. У нас сейчас Login/Register разделены — это OK, разные flows. Но в checkout — следить, чтобы address fields не дублировались.

### 3.3.8 Accessible Authentication (Minimum) — AA

**Что:** auth не должен полагаться на cognitive function tests (memorize, transcribe, solve puzzle).

**E-commerce контекст:**
- Password fields — разрешить paste (`onPaste` не блокировать). LoginScreen.js / RegisterScreen.js — проверить.
- CAPTCHA — если добавим, нужна альтернатива (email-link auth, biometric).
- 2FA — копировать code из SMS должно работать через paste (не блокировать).

---

## E-commerce-specific checklist (proshop_mern flow audit)

Для каждой существующей screen — список a11y-фиксов.

### Header / Navigation (`Header.js`)

- [ ] Skip-to-content link как **первый** focusable element.
- [ ] `<nav aria-label="Main navigation">` на основном меню.
- [ ] `<nav aria-label="User menu">` на dropdown.
- [ ] `aria-current="page"` на активной ссылке.
- [ ] Sticky behavior + `scroll-padding-top` на html.
- [ ] Mobile menu — `aria-expanded` на toggle, focus trap внутри открытого menu.
- [ ] Cart icon — `aria-label="Cart, 3 items"` (число обновляется).
- [ ] SearchBox — `<label for="search">` visible OR `aria-label`. Не только placeholder.

### Home / Product listing (`HomeScreen.js` + `Product.js` + `Paginate.js`)

- [ ] ProductCard клик area — целая карточка, не только title. Wrapped в `<a>` или `<Link>`, не div with onClick.
- [ ] `Rating.js` — `aria-label="4.5 out of 5 stars from 12 reviews"`. Звёзды декоративные (`aria-hidden`).
- [ ] Product images — meaningful `alt` text (не «product image» — описание product'а).
- [ ] Pagination — `<nav aria-label="Pagination">`, current page `aria-current="page"`.
- [ ] Price — semantic markup (опц. schema.org Product).
- [ ] ProductCarousel — pause/prev/next buttons, ARIA roles `tablist`/`tab`/`tabpanel` или `region` w/ controls.

### Product Detail (`ProductScreen.js`)

- [ ] Variant selectors (если будем добавлять size/color) — **swatches**, не dropdown (быстрее scan + лучше для AT).
- [ ] Out-of-stock variants — **grey-out**, не hide.
- [ ] Add-to-cart button — sticky на mobile + always visible above fold на desktop.
- [ ] Quantity stepper — Plus/Minus buttons + numeric input, не drag-only.
- [ ] Reviews section — heading hierarchy (h2 «Reviews», h3 reviewer name), `aria-live="polite"` на counter updates.
- [ ] Image gallery — thumbnails as `<button>` с `aria-label`, clicking меняет main image с announcement.

### Cart (`CartScreen.js`)

- [ ] Cart drawer (если откроем как dialog) — `role="dialog"` + `aria-modal="true"` + focus trap + Escape close.
- [ ] Cart updates (qty change, remove) — `aria-live="polite"` announcement: «Item removed. New total: $84.»
- [ ] Quantity steppers — keyboard accessible, value updates announced.
- [ ] «Remove» icon button — `aria-label="Remove {product name} from cart"`.
- [ ] Undo (5-second window) после remove — toast с focus management.
- [ ] Empty cart state — heading + explanation + clear CTA.

### Checkout flow (`Shipping → Payment → PlaceOrder → Order`)

- [ ] `CheckoutSteps.js` — visualize прогресс, `<nav aria-label="Checkout steps">`, current — `aria-current="step"`.
- [ ] Each form input — visible label `<label htmlFor>`, не placeholder-only.
- [ ] Required fields — visible asterisk + `aria-required="true"`.
- [ ] Inline validation — real-time + `aria-describedby` linked error.
- [ ] Error messages — `role="alert"` или live region, acknowledge/explain/instruct framework (см. [`microcopy.md`](microcopy.md)).
- [ ] Address autocomplete — поддержать (reduces Redundant Entry).
- [ ] Payment step — security badges near submit, не в footer.
- [ ] Guest checkout option (не форсить регистрацию).
- [ ] On success: focus moves to confirmation heading + announce.

### Forms (Login, Register, Profile, Edit screens)

- [ ] Password field — `type="password"` + show/hide toggle (`aria-pressed`).
- [ ] Password requirements — описаны до ввода, не только в error.
- [ ] Email field — `type="email"`, `autocomplete="email"`.
- [ ] Address fields — корректные `autocomplete` atoms (`street-address`, `postal-code`, etc.).
- [ ] Submit button — `aria-busy="true"` + spinner during request.
- [ ] Server errors — focus moves to error summary on top + `role="alert"`.

### Modals & dialogs

Используем в proshop_mern для: confirm delete (admin), product preview (опц.), AI chat (если D5).

```jsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
  <h2 id="modal-title">Confirm deletion</h2>
  <p id="modal-description">Delete user "John Doe"? This cannot be undone.</p>
  <button onClick={confirm}>Delete</button>
  <button onClick={close} aria-label="Cancel and close dialog">Cancel</button>
</div>
```

- [ ] Focus trap: Tab cycles в dialog, не уходит наружу.
- [ ] Initial focus: первая interactive element OR heading с `tabindex="-1"`.
- [ ] Return focus: на trigger button после close.
- [ ] Escape key closes.
- [ ] Background click closes (optional, не для destructive).

### Toast / live announcements

```jsx
<div role="status" aria-live="polite" aria-atomic="true">
  Item added to cart
</div>
```

- `polite` для non-critical (cart updates, save success).
- `assertive` для critical (form errors, payment failure).
- НЕ over-use — toast each scroll = noise.

---

## Color contrast — verified pairs

После выбора preset в [`tokens.md`](tokens.md) — заполняем эту таблицу. Шаблон:

| Pair | Used in | Ratio | WCAG | Status |
|------|---------|-------|------|--------|
| `--foreground` on `--background` | body text | TBD | AA (≥4.5) | TBD |
| `--muted` on `--background` | hints | TBD | AA (≥4.5) | TBD |
| `--primary-fg` on `--primary` | primary button | TBD | AA (≥4.5) | TBD |
| `--ring` on `--background` | focus indicator | TBD | AA (≥3.0) | TBD |
| `--destructive` on `--background` | error text | TBD | AA (≥4.5) | TBD |

Tooling: https://webaim.org/resources/contrastchecker/ + Chrome DevTools color picker.

---

## Focus styles — locked

**Default** для всех focusable:

```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

- ❌ `outline: none` без replacement — никогда.
- ✅ Min 3:1 contrast против background (WCAG 2.4.7).
- ✅ Min 2px thickness, либо `box-shadow` ring если outline скрыт overflow (например в dropdowns).
- ✅ Visible на light + dark mode (поэтому `--ring` defined per theme).

**Кастомный focus для тёмного bg на светлом фоне dropdown:**

```css
.dropdown-item:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: -2px;  /* inside, чтобы не пересекался с border */
}
```

---

## Touch targets — minimum 24×24, primary 44×44

Layout grid:

```
Icon-only buttons:     32×32px (cluster ≥ 8px spacing)
Default buttons:       40px height min, 16px x-padding
Primary action:        44×44px (sticky CTAs, Add to Cart, Checkout)
Inline text links:     any size (WCAG exception)
Quantity stepper +/-:  32×32px each, 4px gap (centred)
```

---

## Keyboard navigation — manual smoke test plan

Перед каждым PR в P0 screens — оператор проходит этот test:

1. Mouse unplugged.
2. Tab from page load — landing на skip-link.
3. Skip-link → main content.
4. Tab через nav → search → main grid.
5. Reach Add to Cart на product card — Enter активирует.
6. Tab continue → footer.
7. Shift+Tab — обратный обход, order стабильный.
8. Каждый focused element — фокус видим, не перекрыт.
9. Modal opens → Tab cycles inside.
10. Escape closes modal → focus возвращается на trigger.

Если хоть один шаг fail — PR заблокирован.

---

## Screen reader smoke test

**NVDA (Windows, free)** или **VoiceOver (macOS, Cmd+F5)** — после major changes:

- Headings (H key in NVDA) — иерархия H1 → H2 → H3 без skips.
- Landmarks (D key) — main / navigation / search / contentinfo все читаются.
- Form fields (F key) — label + value + required + error все announced.
- Cart updates — live region announce.
- Errors — `role="alert"` immediately announced.

**Automated baseline:**

```bash
npm install -D @axe-core/cli
npx axe http://localhost:3000 --stdout
```

Zero критических violations перед merge. Axe ловит ~30% — остальное manual.

---

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Что сохраняем при reduced motion:**
- Functional feedback (loader spinner — slowed but present).
- Focus indicators (instant transition, не fade).
- Color/opacity changes (заменяют motion как feedback).

**Что убираем:**
- All entrance animations (skeleton appears instant).
- Page transitions.
- Hover scale transforms.
- Carousel auto-advance.

См. [`motion.md`](motion.md).

---

## CI / automated tests

Recommendations (для будущего):

```js
// jest + jest-axe
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

test('Product card has no a11y violations', async () => {
  const { container } = render(<Product product={mockProduct} />)
  expect(await axe(container)).toHaveNoViolations()
})
```

Playwright E2E:
- Keyboard-only purchase flow.
- VoiceOver + Tab через checkout.
- Contrast assertions через `@axe-core/playwright`.

---

## Sign-off checklist (для каждого PR в design redesign)

- [ ] WCAG 2.1 AA — all criteria met
- [ ] WCAG 2.2 — 6 new AA criteria met
- [ ] Keyboard navigation — full flow без mouse
- [ ] Focus visible, never obscured
- [ ] Screen reader test — NVDA OR VoiceOver passed
- [ ] Color contrast — all pairs ≥ 4.5:1 (or 3:1 for UI/large text)
- [ ] Touch targets — primary 44×44, secondary 24×24+
- [ ] Forms — labels + inline validation + error linking
- [ ] Live regions — cart, filters, errors
- [ ] Reduced motion — gated
- [ ] axe-core — zero critical violations

---

## Cross-refs

- Main navigator: [`../../Design.md`](../../Design.md)
- Tokens (focus ring colors): [`tokens.md`](tokens.md)
- Motion (reduced-motion fallback): [`motion.md`](motion.md)
- Microcopy (error/empty state copy): [`microcopy.md`](microcopy.md)
- M4 canonical: [accessibility-expert prompt](https://github.com/Serg1kk/aidev-course-materials/blob/main/M4/agents/accessibility-expert/prompt.md)
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
