# Demo script

## Read-only completed-case path (recommended)

1. Open the [completed Gold case](https://metal-arena.vercel.app/?case=gold-2026-09-13-20-00-00Z) without connecting a wallet.
2. Confirm the banner identifies predetermined synthetic fixtures and links to the [public proof manifest](https://metal-arena.vercel.app/evidence/metal-arena-gold-case.json).
3. Select the Gold row from on-chain history. Show the exact interval, fixed-point observations, evidence URL and hash, `FINALIZED` finality, `UP` outcome, and claimable settlement state.
4. Open the manifest and its public explorer links for settlement, the 980-credit UP payout, and the expected duplicate-claim rollback. Explain that these deployment-scoped links are independent of browser-local transaction history.
5. State the boundary clearly: this is a predetermined mechanics demonstration using synthetic evidence, not fair competitive trading, real metal ownership, or independent commodity-price verification.

## Recorded controlled flow (historical evidence)

1. Open [`https://metal-arena.vercel.app`](https://metal-arena.vercel.app) and confirm the banner says synthetic evidence, not live prices.
2. The recorded run toggled Gold and Silver to show the shared 15-minute protocol metadata. On-chain history is separate from the clearly labeled mechanics-only synthetic examples.
3. In the recorded StudioNet run, the configured wallet claimed the one-time 1,000 demo-credit allocation.
4. Do not open another hosted interval for this submission. The recorded `open_next_market(GOLD)` call created `gold-2026-09-13-20-00-00Z` at `2026-09-13T19:45:29Z`; the configured release requires matching published evidence before offering another interval.
5. The recorded run staked 600 on UP and 400 on DOWN. The contract read-back showed two positions in the same market, including pagination-safe history.
6. The recorded run allowed the real interval to expire without editing timestamps or using a local clock override.
7. After expiry and before the deadline, the recorded run requested settlement. Validators fetched the frozen public fixture independently; the browser did not choose the winner.
8. The recorded run polled the market and separate finality gate with bounded backoff. Only after `finalized:true` did the winning position expose a claim.
9. The recorded run claimed the UP payout. For the 600/400 pool, the synthetic fixture resolved UP, the 2% fee was 20 credits, and the payout was 980 credits.
10. The recorded run repeated the same claim once. The expected finalized rollback was `[EXPECTED] position already claimed`; account and position state remained unchanged.
11. For submission, select the market from on-chain history and show the public settlement record: exact boundary timestamps, fixed-point observations, evidence hash, source URL, finality, and public transaction links. Browser-local transaction history is separate.

## Refund path

For a separate controlled run, use equal prices, a one-sided pool, or wait through the settlement deadline. Confirm that the contract resolves to `REFUND`, charges no fee, and still requires the finality gate before claims. Never present predetermined synthetic values as fair competitive market data.

If a live source or contract address is not configured, the UI remains in preview mode. Preview actions are explicitly labeled in-memory and must not be presented as on-chain results.
