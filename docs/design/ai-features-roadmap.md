# AI Features Roadmap — CORE patterns (post-emox extract)

> **STATUS — promoted to CORE 2026-05-14.** Сергей предоставил emox-references, где AI assistant — не «опциональная feature», а **визуальный центр продукта**.
>
> D5 закрыт как **(c) full conversational shopping assistant + AI image generation**.
> Patterns 1, 2, 7 — **P0 must-have** для Phase 1.
> Patterns 3-6, 8 — P1 / P2 backlog.

---

## Зачем

proshop_mern — учебный demo для HSS-курса M4+. AI-фичи в e-commerce стали ожидаемой частью UI в 2026 (Cursor, Perplexity, Wayfair Rufus, AmazonRufus, ShopAI, etc.). Backlog паттернов нужен на момент, когда:
- M5+ модули введут agent-build practices.
- Сергей будет демонстрировать AI-UX patterns студентам.

Каждый pattern описан с UX-decisions, не с конкретной интеграцией (LLM provider, RAG store).

---

## Pattern catalog

### 1. Semantic search bar — заменяет regex-based search  ★ P0 CORE

**Текущий `SearchBox.js`:** keyword match, GET `/search/:keyword`.

**AI-version:** semantic / natural language search.
- «laptop for video editing under $1500» → AI извлекает intent + filters.
- «black jacket for winter» → returns подходящие SKUs независимо от exact keywords в description.

**UX:**
- Same search bar location (header) — не меняем mental model.
- Подсказки под input (typing suggestions, autocomplete категорий).
- На submit: loading state «Understanding your request…» + плановый ETA («usually 2 sec»).
- Результаты с inline highlight: «We matched on "winter" → black puffer jacket, $179».

**Confidence/trust UX:**
- При low confidence: «We found 3 products that might match. Adjust your search if not quite right.»
- Allow «Show all matches» fallback на keyword-based search.

### 2. Conversational shopping assistant (chat drawer)  ★ P0 CORE — emox signature

**emox specifics (must-replicate):**
- **Right-side closable drawer**, не corner widget. ~384px wide.
- Header: gradient «Ai» wordmark (AIIdentityBadge) + close × button.
- Conversation thread:
  - User messages: right-aligned, light-gray pill bg `--surface-tinted`.
  - AI messages: left-aligned, **no bubble**, ✨ sparkle prefix, supports emojis sparingly (🎨✨).
- Contextual CTA card mid-conversation: GenerateImagesCard with 3D illustration + bold copy + primary blue CTA.
- SuggestionChip row below CTA (one-tap fill input): «denim Jacket», «Purple Jacket», «leather Jacket».
- AIPromptInput at bottom: aurora border (animated) + ✨ sparkle prefix + «Ask anything…» placeholder + voice mic icon right.
- Affirmative AI tone: «Absolutely! …», «Sure …», «Of course …» — friendly framing.
- Drawer state persisted (localStorage) across navigations.

**Where:** floating button bottom-right или primary nav item «Help».

**Pattern:** chat sidebar, не chatbot-widget-corner. Following [Sibbi / Alhena / Gorgias](https://www.gorgias.com/ai-agent/shopping-assistant) UX.

**UX design:**

Header bar:
- Identity badge: «Aisha — your shopping helper · powered by AI».
- Always-visible disclosure: «I can browse products, compare, and add to cart. I can't process payments or change your account.»

Empty state (first open):
- 1-2 sentence intro.
- 3-4 suggested prompts: «Find me a gift for runner», «Compare X vs Y», «What's good under $50».

Streaming response:
- Token-by-token render.
- Plan preview if multi-step: «1. Searching catalog → 2. Filtering by your budget → 3. Comparing top 3».
- Reasoning trace — collapsed by default, expandable.
- Stop / Regenerate buttons.

Tool calls visualisation:
- «Searching catalog…» / «Pulling reviews…» — named status, не generic spinner.

Inline product cards within chat:
- Image / title / price / rating / [Add to cart].
- Compact, max 3-4 cards per message.

Cross-sells:
- After «Add to cart» action — single complementary suggestion: «Bought this also got X. Add for $15?»
- Not pushy — 1 suggestion, dismissible.

Citations:
- Когда AI ссылается на product reviews — `[1]` superscript → expandable source card with reviewer name + excerpt.

Feedback:
- 👍 / 👎 на каждом AI response.
- Inline regenerate button.

A11y (must):
- `<dialog>` semantics for chat drawer.
- `aria-live="polite"` on streaming response container.
- Keyboard: Enter to send, Shift+Enter for newline, Escape to close drawer.
- Focus management on open/close.

### 3. Plan preview pattern (для long-running operations)

Если будет complex flow (return / refund / order modification):

- Submit form → immediate render «3 steps — validating, checking inventory, processing» → каждый step lights up по completion.
- Cancel button always visible во время run.
- Time-shape expectation: «This usually takes about 30 seconds».

### 4. Confidence indicators

Когда AI делает рекомендации:

- **High confidence** — verified sources (RAG with known-good documents), badge: green dot + «Recommended based on 1,200 similar purchases».
- **Medium** — mix retrieved + model knowledge, amber dot + «Suggested — verify before purchase».
- **Low** — pure generated, no badge или explicit «Generated suggestion — please verify».

Confidence — derived from structural signals (RAG hit, tool success), не model self-assessment.

### 5. AI product description generator (admin side)

Для `ProductEditScreen.js`:
- «Generate description» button → AI создаёт draft based on title + image + specs.
- Always inline editable before save.
- Disclosure: «Generated by AI — review before publishing».

### 6. AI image alt-text generator (admin)

Для image upload:
- На upload → AI generates `alt` text.
- Editable before save.
- Disclosure tooltip.

### 7. AI image generation — emox-specific  ★ P0 CORE

emox demonstrates AI-image-generation as core shopping-discovery tool. Юзер просит «floral patterned puffer jackets» — система генерит 4 AI images, юзер кликает любую — переходит на similar-products search.

**Pattern:**
- Inline within AI drawer: bold heading «Generate an image of the item you're looking for and shop similar-looking products».
- 3D illustration thumbnail (decorative — stacked images icon).
- Primary CTA: «Generate images» — pill button с sparkle ✨ prefix, primary blue.
- 3 SuggestionChips below: contextual filter shortcuts.
- On submit:
  - Status line: «Generating AI images» (named, not «Loading…») с image-icon prefix.
  - 4-up image grid renders as soon as ready (streaming if backend supports).
  - Each image clickable → similar-products search via reverse image lookup.
- Disclosure tooltip: «AI-generated. Shop real similar products.»

**Implementation later (backlog):**
- Backend: image-generation endpoint (Replicate / Stable Diffusion / Imagen).
- Frontend: optimistic UI, skeleton 4-up grid, error fallback.

### 8. AI loading states (general)

Из patterns 2026:

- **TTFT 200-500ms** — streaming starts within half-second of submit.
- **Skeleton placeholder** для response container — reserve space avoid layout shift.
- **Status labels** — «Thinking…», «Retrieving…», «Generating…» (named, не generic).
- **Stream complete** — subtle pulse fade-out на response panel.
- **Cancel button** always visible during stream.

### 9. Memory / context visibility

If we add personalisation:

- Always visible in chat header: «Remembering: budget $50-100, prefers black, vegan».
- One click to edit / forget.
- Never silent retention.

---

## Stack recommendations (опционально)

Если будем шипить:

| Layer | Recommendation |
|-------|----------------|
| LLM provider | Anthropic Claude (default) or OpenAI GPT-5 |
| Streaming | Vercel AI SDK `useChat` (handles buffering, cancellation, error retry) |
| Embeddings | OpenAI text-embedding-3-small (cheap, good enough for product catalog) |
| Vector store | pgvector (Mongo doesn't fit — пришлось бы Postgres миграция) — backlog, не P0 |
| Chat UI | Build на shadcn (`dialog` + `card` + `scroll-area`) или AI UX Kit / Vercel AI SDK UI primitives |
| Tool calls | Anthropic tool use или OpenAI function calling — server-side |
| Citations rendering | Inline numbered `[1]` + expandable source card |

---

## Anti-patterns (avoid)

- ❌ Generic chatbot widget bottom-right with «Hi! How can I help?» — students will immediately recognize as AI slop.
- ❌ Silent retries on rate-limit (показывать «Provider is slow, retrying…»).
- ❌ Auto-dismissing reasoning trace — make it optional but persistent.
- ❌ Forcing AI чат для everything (offer manual fallback, e.g., contact form).
- ❌ AI-flavored microcopy («Let me help you find the perfect…») — keep it concrete: «Find products. Tell me what you need.»
- ❌ Confidence badges as theatre (color-coded wrapper around vibes без structural signals).

---

## Implementation milestones (post-emox: AI = P0 core)

- **M0 (Phase 1) — UI shell.** AIDrawer + AIMessage + AIPromptInput + AIIdentityBadge + SparkleIcon + AuroraBorder, всё через mock data (static «Try asking about colorful puffer jackets»). Сергей может демонстрировать UX без backend. ★ P0.
- **M1 — Streaming chat backend.** Anthropic/OpenAI streaming через Vercel AI SDK `useChat`. ★ P0.
- **M2 — RAG over product catalog.** Semantic search returns real proshop_mern products. Pgvector OR Algolia hybrid. P1.
- **M3 — Tool calls.** add-to-cart, browse-category, compare-products. P1.
- **M4 — AI image generation.** Replicate / Imagen / Stable Diffusion endpoint. GenerateImagesCard полностью функциональный. P2.
- **M5 — Confidence indicators + citations.** P2.
- **M6 — Memory / personalisation.** P3.
- **M7 — Admin-side AI** (product description generator, alt-text generator). P3.

Каждый milestone — отдельный design declaration (UX-decisions, не визуальные).

---

## Sources

- yaroslavboiko «Agentic UX Primitives» 2026-04.
- Cloudscape `genai-loading-states` (AWS design system).
- AIUX Design Guide (Imran) — conversational UI architecture.
- Tianpan «Agent Loading State Problem» 2026-04.
- Gorgias / Alhena / Marqo Sibbi / Zoovu Zoe — shopping assistant patterns 2026.

---

## Cross-refs

- Main: [`../../Design.md`](../../Design.md) §13
- A11y (chat drawer accessibility): [`accessibility.md`](accessibility.md)
- Motion (streaming animations, reduced motion): [`motion.md`](motion.md)
- Microcopy (AI status labels, disclosure copy): [`microcopy.md`](microcopy.md)
