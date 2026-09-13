# Demo script

1. Open the hosted console and confirm the banner says synthetic evidence, not live prices.
2. Toggle Gold and Silver to show the shared 15-minute protocol metadata.
3. Connect a test wallet, claim the one-time demo-credit allocation, and open the next UTC quarter-hour market.
4. Stake on UP from one account and DOWN from another before the cutoff. The estimate should change with pool composition and show the 2% fee rule.
5. After expiry, request settlement. The contract reads the frozen evidence URL through validator consensus; the browser does not choose the winner.
6. Refresh until the market reaches protocol finality. Only then should the winning position expose a claim action.
7. Use the public settlement record to show the rule version, exact boundary timestamps, fixed-point observations, evidence hash, and finality state.
8. For a refund path, use equal prices, a one-sided pool, or wait through the evidence deadline. Confirm the UI says refund and no fee is charged.

If a live source or contract address is not configured, the UI remains in preview mode. Preview actions are explicitly labeled in-memory and must not be presented as on-chain results.
