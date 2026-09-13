# Deployment

MetalArena deploys two contracts and binds them in this order:

1. `SettlementGate` — receives the finalized settlement callback and exposes the claim gate.
2. `MetalArena` — owns markets, demo-credit balances, stakes, evidence consensus, and deterministic payout math.
3. Gate → arena authorization.
4. Arena → gate configuration.

Use the official CLI with a configured account:

```powershell
genlayer network set studionet
npm run deploy
```

The script waits for finalized receipts and writes `deploy/last-deployment.json` only after all four steps succeed. It prints the arena address for `NEXT_PUBLIC_METAL_ARENA_ADDRESS`.

No private key or secret is stored in the repository. Deploying does not seed user balances or open a market; those are explicit public transactions for the demo flow.
