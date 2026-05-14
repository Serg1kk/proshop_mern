# Motion System — 2 кривые, CSS-only

> Раскрытие §8 из [`../../Design.md`](../../Design.md).
>
> **Подход:** Frigade-style — два cubic-bezier и три duration-токена покрывают ~90% UI motion. Никаких animation libraries (Framer Motion / GSAP) до тех пор, пока feature не потребует state-dependent motion, которого CSS не умеет.

---

## Motion tokens

```css
:root {
  /* Duration scale */
  --duration-instant:   80ms;    /* below human perception threshold */
  --duration-fast:      150ms;   /* hover, focus, micro-feedback */
  --duration-base:      220ms;   /* dropdown, modal open, toggle */
  --duration-slow:      320ms;   /* page enter, drawer slide */
  --duration-deliberate: 480ms;  /* hero reveal, story moments */

  /* Easing curves — Frigade canonical */
  --ease-entrance:    cubic-bezier(0.23, 1, 0.32, 1);
  /* Fast attack + gentle deceleration. Slight overshoot.
     Use for: hero reveals, banners, content fade-in, error states. */

  --ease-interaction: cubic-bezier(0.32, 0.72, 0, 1);
  /* Tighter curve. Immediate response.
     Use for: dropdowns, modals, hovers, button presses. */

  --ease-exit:        cubic-bezier(0.7, 0, 0.84, 0);
  /* Ease-in. Use for: dismissal, fade-out (faster than entrance). */

  /* Stagger */
  --stagger-tight:  40ms;
  --stagger-base:   60ms;
  --stagger-relaxed: 80ms;
}
```

**Правило 2 curves:** все CSS transitions в проекте используют **только** `--ease-entrance` или `--ease-interaction`. Линейные / стандартные `ease-in-out` / bounce / elastic — **запрещены**.

---

## Duration rules per interaction type

| Interaction | Duration | Curve |
|-------------|----------|-------|
| Hover state (color, bg, border) | 150ms (fast) | interaction |
| Focus ring appearance | 150ms (fast) | interaction |
| Button press (active state) | 80ms (instant) | interaction |
| Toggle / checkbox | 220ms (base) | interaction |
| Dropdown / popover open | 220ms (base) | interaction |
| Modal open (overlay fade) | 220ms (base) | entrance |
| Modal close | 150ms (fast) | exit |
| Drawer / cart slide-in | 320ms (slow) | entrance |
| Drawer slide-out | 220ms (base) | exit |
| Page enter (route change) | 220ms (base) | entrance |
| Hero stagger (per element) | 320ms (slow) | entrance, 60ms stagger |
| Skeleton shimmer | 1500ms infinite | linear |
| Spinner rotation | 800ms infinite | linear |

**General principle:** exit faster than entrance (~70% of duration). Decelerate (ease-out) feels natural for entering objects; accelerate (ease-in) feels natural for leaving.

---

## Allowed properties — only transform + opacity

```css
/* ✅ ОК — GPU accelerated, no layout thrash */
.card {
  transition: transform var(--duration-fast) var(--ease-interaction),
              opacity var(--duration-fast) var(--ease-interaction);
}
.card:hover {
  transform: scale(1.01);
}

/* ❌ Запрещено — triggers layout */
.card-bad {
  transition: width var(--duration-fast) ease, padding 0.2s;
}
```

Animating `width / height / padding / margin / top / left / right / bottom` — запрещено вне очень редких исключений (например, accordion expand). Тогда — `max-height` или `grid-template-rows: 0fr → 1fr` (CSS Grid hack для smooth height).

---

## Stagger entrance

Для lists, hero blocks, product grids — элементы появляются sequentially, не all-at-once.

### CSS-only через `@starting-style` (Chrome 117+, Safari 17.5+, FF 129+ — coverage 92%+ в 2026)

```css
.hero-item {
  opacity: 1;
  transform: translateY(0);
  transition: opacity var(--duration-slow) var(--ease-entrance),
              transform var(--duration-slow) var(--ease-entrance);
}

@starting-style {
  .hero-item {
    opacity: 0;
    transform: translateY(8px);
  }
}

.hero-item:nth-child(1) { transition-delay: 0ms; }
.hero-item:nth-child(2) { transition-delay: 60ms; }
.hero-item:nth-child(3) { transition-delay: 120ms; }
.hero-item:nth-child(4) { transition-delay: 180ms; }
.hero-item:nth-child(5) { transition-delay: 240ms; }
```

**Stagger cap:** не более 6-8 элементов в одной staggered группе. Иначе последний элемент появится через 480ms+ и юзер заскучает. Для длинных списков (например, product grid 20+ items) — stagger только первые 6, остальные fade-in уже visible (IntersectionObserver на scroll).

### Fallback для старых браузеров

```css
@supports not (selector(:has(*))) {
  .hero-item { opacity: 1; transform: none; }
}
```

Если @starting-style не поддерживается — элементы появляются сразу без стаггера. Не graceful degradation на JS — лишний 30KB.

---

## Component motion patterns

### Buttons

```css
.btn {
  transition: background-color var(--duration-fast) var(--ease-interaction),
              border-color var(--duration-fast) var(--ease-interaction),
              transform var(--duration-instant) var(--ease-interaction);
}

.btn:hover  { transform: scale(1.01); }
.btn:active { transform: scale(0.98); }
```

### Cards

```css
.card {
  transition: border-color var(--duration-fast) var(--ease-interaction);
}

.card:hover {
  border-color: var(--primary);
}
```

**NO scale on cards.** Scale на больших элементах создаёт layout thrash perception. Только border-color shift или slight bg-shift.

### Modal overlay

```css
.modal-overlay {
  opacity: 1;
  transition: opacity var(--duration-base) var(--ease-entrance);
}

@starting-style {
  .modal-overlay { opacity: 0; }
}

.modal-content {
  transform: scale(1);
  opacity: 1;
  transition: transform var(--duration-base) var(--ease-entrance),
              opacity var(--duration-base) var(--ease-entrance);
}

@starting-style {
  .modal-content {
    transform: scale(0.96);
    opacity: 0;
  }
}
```

### Cart drawer slide-in

```css
.cart-drawer {
  transform: translateX(0);
  transition: transform var(--duration-slow) var(--ease-entrance);
}

.cart-drawer[data-state="closed"] {
  transform: translateX(100%);
}
```

### Skeleton shimmer

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--card)      0%,
    var(--card-alt)  50%,
    var(--card)      100%
  );
  background-size: 200% 100%;
  animation: shimmer 1500ms ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

### Loading spinner

```css
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Используем spinner только** когда:
- Form submitting (button с `aria-busy`).
- Single async action that blocks UI (login, place order).

Иначе — **skeleton shimmer** даёт лучшее perceived performance.

### Toast / alert appear

```css
.toast {
  transform: translateY(0);
  opacity: 1;
  transition: transform var(--duration-base) var(--ease-entrance),
              opacity var(--duration-base) var(--ease-entrance);
}

@starting-style {
  .toast {
    transform: translateY(8px);
    opacity: 0;
  }
}
```

---

## Reduced motion — non-negotiable

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Skeletons — keep static muted */
  .skeleton {
    animation: none;
    background: var(--card);
  }

  /* Spinner — keep low-opacity static circle */
  .spinner {
    animation: none;
    border-top-color: var(--border);
    opacity: 0.7;
  }
}
```

**Замена motion на не-motion feedback:**

- Hover state → color change (но без transform scale).
- Toggle → instant color flip без slide.
- Modal → instant appearance без scale-in (но overlay opacity OK — opacity не motion).
- Cart update → live region announce + instant counter update (без count-up animation).

---

## What NOT to animate (anti-AI-slop)

- ❌ All elements fade-in at once on page load (classic AI-look).
- ❌ Bounce / elastic curves (`cubic-bezier(0.34, 1.56, 0.64, 1)` — feels tacky in 2026).
- ❌ Scale transforms ≥ 1.05 on hover (too dramatic).
- ❌ Parallax scroll (decorative, often inaccessible).
- ❌ Animated backgrounds (gradients moving, particles, abstract blobs).
- ❌ Hover effects that shift layout (avoid scale on cards adjacent to other cards).
- ❌ Auto-advancing carousels без pause control.
- ❌ Long animations (>500ms на interactive feedback — feels syrupy).

---

## Open question (D8)

[`../../Design.md`](../../Design.md) D8: остаёмся на pure CSS or добавляем Framer Motion?

**Recommendation:** CSS-only пока. Triggers для apgrade на Framer Motion:
- Появилась feature, где motion зависит от React state (например, drag-to-dismiss cart drawer).
- Layout animations (FLIP transitions между list reorderings).
- Gesture handling beyond hover (swipe, pan, drag).

До тех пор — экономим 30KB bundle и держим simplicity.

---

## Verification checklist

Перед merge:

- [ ] All transitions use `--duration-*` and `--ease-entrance` / `--ease-interaction` tokens. No hardcoded durations / easings.
- [ ] No animations of width / height / margin / padding / position properties.
- [ ] Reduced-motion media query covers всё animated.
- [ ] Stagger cap: ≤ 8 elements в одной staggered group.
- [ ] Auto-advancing elements (carousel) — pause/stop controls.
- [ ] Skeleton shimmer на async content, spinner — только на user-initiated actions.

---

## Cross-refs

- Main: [`../../Design.md`](../../Design.md)
- Tokens (duration / easing vars): [`tokens.md#motion`](tokens.md#motion)
- A11y (reduced motion + non-motion feedback): [`accessibility.md#reduced-motion`](accessibility.md#reduced-motion)
- Reference: Frigade — «two easing curves, no animation library» (2026-05).
