# MetalArena visual direction

<!-- impeccable:design-schema 1 -->

## Direction

**Settlement console** — a compact assay-room instrument for observing a live interval, committing a prediction, and reading the evidence trail after expiry. The surface is dark and matte so the data reads like a calibrated instrument panel, not a casino screen.

## Mode

Operate. The first viewport is the working surface: a header establishes the network and data truth, the chart carries the current benchmark movement, and the right rail puts the upcoming pool, stake action, and lifecycle in the same visual field.

## Materials and palette

- Matte graphite canvas: `#101315` with near-black navigation: `#0A0D0E`.
- Warm assay brass for Gold: `#D7A85A`, with a softer wash `#F0CA82` for selected states.
- Quiet silver for Silver: `#B9C6CB`, with `#E5EEF0` for selected states.
- Signal cyan for evidence and protocol states: `#77D6D0`.
- Muted slate text: `#8E9A9D`; high-contrast paper text: `#F1EEE7`.
- Thin measurement rules and panels: `#2A3336`; no gradients or decorative glow.

## Typography

Use Geist / Arial, a restrained sans with tabular numerals for prices, amounts, and timestamps. Labels are small uppercase with moderate tracking; headings use weight and spacing rather than a display face. Data is readable first and the interface never uses monospace as costume.

## Composition

- Persistent 64px top bar with wordmark, metal selector, testnet badge, and wallet action.
- Wide two-column workbench: 1fr chart/evidence field and 360px settlement rail on desktop; stacked chart then rail on mobile.
- Panels use a 1px rule and shallow offset shadow only where separation is needed; corners are 12px, controls 9px, pills reserved for status.
- Dense content is grouped by clear rule lines and aligned numerals. The chart has a deliberate quiet lower band for the benchmark/source legend instead of floating decoration.

## Signature interaction

The stake amount is a controlled instrument: changing it updates only the user's preview and the proportional payout estimate, with an explicit “variable until lock” label. Submitting the stake switches the row to “submitted / checking finality” and never upgrades the state based on a hash alone.

## State language

`UPCOMING`, `LIVE`, `AWAITING SETTLEMENT`, `FINALIZED`, `CLAIMABLE`, `REFUND`, and `PENDING EVIDENCE` are first-class labels. Gold and Silver are category colors; cyan is reserved for verified protocol/evidence state; amber is reserved for caution; red is only for hard errors.

## Honest risk

The compact console can resemble a trading terminal. Copy must keep “prediction position”, “demo credits”, and “synthetic replay” visible so the density never implies ownership of metals, real liquidity, live market data, or guaranteed returns.

## Responsive rules

At widths below 900px, the header compresses to brand + metal selector + wallet; the workbench becomes one column, with the entry rail immediately after the chart and details below. At widths below 560px, pool comparison becomes a two-row table, control labels stay visible, and all primary actions remain full width with a 44px minimum target.
