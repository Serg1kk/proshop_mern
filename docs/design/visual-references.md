# Visual References

> 2026-05-14 — Сергей предоставил 5 скриншотов **e_mox** (AI-native fashion-marketplace, UAE/AED market). Это закрывает D1 / D5 / D6 / D8.
>
> Полный extract (палитра, типографика, layout, signature elements, новые компоненты) — [`references/emox-extract.md`](references/emox-extract.md).

---

## Reference table

| # | Filename / source | Что показывает | Что взяли |
|---|--------------------|----------------|-----------|
| 1 | emox tablet — search results + AI drawer open | Storefront overview: aurora-border search bar, filter chips, brand strip, product grid, right-side AI assistant с conversation + Generate-images CTA + suggestion chips | Whole layout architecture, AI drawer pattern, BrandStrip component, FilterChipBar, SuggestionChip, AIMessage variants |
| 2 | emox — closeup split view, AI generating | "Generating AI images" status, 2×2 AI-generated jacket grid, mic voice input | AI image generation pattern, named loading states ("Generating AI images"), voice mic input в prompt |
| 3 | emox — PDP (Women's Cropped Denim Jacket) | Full header w/ search + sub-nav + location, breadcrumb, 50/50 image+details, size selector pills, BNPL row (tabby/tamara), big primary CTA «Add to cart», Protection Plan card, Shipping/Pickup tiles, seller info, free returns row | Complete PDP layout, all new components (Breadcrumb, SizeSelector, BNPLRow, ProtectionPlanCard, DeliveryOptionTile, SellerInfoBlock), PriceLockup, header sub-nav with PromoBadges |
| 4 | emox — same as #1 but on iridescent gradient backdrop | Brand vibe at extreme — pastel rainbow gradient frames the UI | Confirms aurora gradient as signature accent, NOT just for borders but brand identity |
| 5 | emox — closeup right AI panel | Chat history + Generate images card + Ask anything bottom input with aurora border + mic | AIDrawer composition details, AIPromptInput pattern, GenerateImagesCard composition |

---

## Visual direction — closed

**Aurora-commerce.** Clean white surface + saturated royal blue functional primary + iridescent pastel gradient as AI signature accent. Light-first. Mobile-aware но primary breakpoint — tablet/desktop.

Sister archetypes (for reference): Klarna 2025, Wayfair Rufus, Shopify Magic, Pinterest discovery.

NOT: minimal-tech (too sterile), luxury-serif (no warmth), brutalist (too soft), playful (too rounded).

---

## Token preset selected

➡ See [`tokens.md`](tokens.md) — **Preset D: aurora-commerce (emox-inspired)** has all concrete hex / OKLCH / spacing values extracted from screenshots.

Quick summary:

```
Primary blue:       #1F4FCF
Background:         #FFFFFF
Card / product bg:  #F1F4F8
Text primary:       #0A1020
Text muted:         #6B7280
Aurora gradient:    #FF9FCB → #C5A9FF → #8FC8FF → #B5F0C8 → #FFD78F
Font:               Plus Jakarta Sans
Radius cards:       12px
Radius pills:       9999px
```

---

## Signature elements

➡ See [`signature-elements.md`](signature-elements.md) for full spec.

1. **Aurora border** (animated iridescent stroke on AI/active inputs).
2. **Sparkle ✨** (AI-affordance icon, gradient-filled).
3. **AI gradient text** («Ai» wordmark with background-clip).
4. **PriceLockup** (number bold + currency superscript uppercase).

---

## Next steps

1. ✅ Extract complete → in `references/emox-extract.md`.
2. ✅ Decisions closed → `../../Design.md` updated (D1, D5, D6, D8).
3. ✅ Tokens preset → `tokens.md` updated (Preset D added).
4. ✅ Signature spec → `signature-elements.md` created.
5. ✅ Screen inventory → `screen-inventory.md` updated с 16 новыми компонентами.
6. ⬜ Phase 0 implementation: install Tailwind 4 + Plus Jakarta Sans + create `globals.css` with Preset D tokens.
7. ⬜ Phase 1: Header + Footer + Home + Product + AIDrawer shell.

---

## Cross-refs

- Main navigator: [`../Design.md`](../Design.md)
- Detailed extract: [`references/emox-extract.md`](references/emox-extract.md)
- Tokens: [`tokens.md`](tokens.md)
- Signature: [`signature-elements.md`](signature-elements.md)
- AI features (core, post-extract): [`ai-features-roadmap.md`](ai-features-roadmap.md)
- Screen redesign roadmap: [`screen-inventory.md`](screen-inventory.md)
