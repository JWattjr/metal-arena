# Demo script

## Re-run the controlled flow

1. Open [`https://metal-arena.vercel.app`](https://metal-arena.vercel.app) and confirm the banner says synthetic evidence, not live prices.
2. Toggle Gold and Silver to show the shared 15-minute protocol metadata. On-chain history is separate from the clearly labeled mechanics-only synthetic examples.
3. On StudioNet, connect the configured wallet and claim the one-time 1,000 demo-credit allocation.
4. Open the next aligned market only when the previous market has ended. For the recorded run, `open_next_market(GOLD)` created `gold-2026-09-13-20-00-00Z` at `2026-09-13T19:45:29Z` for `20:00:00Z → 20:15:00Z`.
5. Before the cutoff, stake 600 on UP and 400 on DOWN. The contract read-back must show two positions in the same market, not one position page entry skipped by pagination.
6. Let the real interval expire. Do not edit timestamps or use a local clock override. The browser disables stake controls at the cutoff.
7. After expiry and before the deadline, request settlement. Validators fetch the frozen public fixture independently; the browser does not choose the winner.
8. Poll the market and separate finality gate with bounded backoff. Only after the gate reads `finalized:true` should the winning position expose a claim.
9. Claim the UP payout. For the recorded 600/400 pool, the synthetic fixture resolves UP, the 2% fee is 20 credits, and the payout is 980 credits.
10. Repeat the same claim once. The expected finalized rollback is `[EXPECTED] position already claimed`; the account and position state must remain unchanged.
11. Select the market from on-chain history and show the public settlement record: exact boundary timestamps, fixed-point observations, evidence hash, source URL, finality, and transaction reference behavior.

## Refund path

For a separate controlled run, use equal prices, a one-sided pool, or wait through the settlement deadline. Confirm that the contract resolves to `REFUND`, charges no fee, and still requires the finality gate before claims. Never present predetermined synthetic values as fair competitive market data.

If a live source or contract address is not configured, the UI remains in preview mode. Preview actions are explicitly labeled in-memory and must not be presented as on-chain results.
