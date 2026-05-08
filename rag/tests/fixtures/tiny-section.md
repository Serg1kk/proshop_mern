# Tiny section fixture

## Glossary one-liner

This section is a deliberately short glossary stub. It defines the term "checkout flow" as the multi-step user journey from cart to confirmation, including shipping address entry, payment selection, and order review.

## Real content

The checkout flow is the most business-critical path in the application, because every dollar of revenue passes through it. Any regression here directly translates into lost orders, so it receives more attention from monitoring and testing than any other route. The flow is implemented as a small state machine on the frontend, with steps for cart review, shipping address, shipping method, payment method, and final review. Each step writes its data into Redux, and the final review step submits a single create-order POST to the backend. The backend validates the entire payload atomically, creates the order document, and returns the order id; only after that response does the frontend clear the cart from localStorage. This ordering matters: clearing the cart before confirmation would lose the user's selections if the network drops between submit and response. The PayPal sandbox handles the actual payment capture; on success the frontend transitions to a thank-you screen and fires an analytics event with the order total and the item count for downstream conversion reporting and funnel analysis.

End-to-end tests cover the happy path on every pull request and the failure paths on the nightly schedule. The happy-path test creates a fresh user, adds a product to the cart, completes the checkout against the PayPal sandbox, and asserts that the order appears in the user's order history and in the admin dashboard. The failure paths exercise the network-drop scenario, the declined-card scenario, and the empty-cart guard. A regression in any of these tests blocks the deployment until a maintainer triages it, because the cost of shipping a broken checkout is higher than the cost of a delayed release.

## Tiny tail

For more details on the checkout endpoints, see the API reference in `docs/api/orders.md` and the related ADR on payment provider selection. The runbook for refunding a charged order lives in `docs/runbooks/refund-order.md`.
