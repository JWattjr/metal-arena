# MetalArena

MetalArena is a compact GenLayer testnet prototype for 15-minute Gold and Silver UP/DOWN prediction markets. The interface is a dark settlement console: market clock and synthetic trace on the left, entry/pool state and evidence details on the right, then on-chain history, positions, and the public settlement record below.

The core distinction is adjudication. The frontend never chooses a winner. After the exact interval ends, validators independently fetch the frozen evidence URL and verify a strict canonical record. The contract then performs deterministic fixed-point comparison and integer pool math. The separate `SettlementGate` contract records finality, and claims are rejected until that record exists.

Current source policy: public synthetic JSON fixtures served from `https://metal-arena.vercel.app/evidence/`. This is deliberate and visible in the UI. It is not live market data. The repository does not invent live prices, trading volume, trader counts, or profits. Replacing it with a real source requires a documented check of exact boundary history, spot/futures semantics, validator access, rate limits, and redistribution licensing.

## Run locally

```powershell
cd "C:\Users\User\Desktop\GenLayer apps\metal-arena"
python -m pip install -r requirements.txt
npm install
npm run dev
```

Without `NEXT_PUBLIC_METAL_ARENA_ADDRESS`, the browser opens in an honest in-memory preview. Preview stakes change only local component state and are never called a ledger, final balance, or settlement.

To connect the app to a deployed contract, copy `.env.example` to `frontend/.env.local` and set the arena address and GenLayer RPC. The frontend expects MetaMask on the configured GenLayer chain.

## Verify

```powershell
python -m pytest -v
genvm-lint check contracts/metal_arena.py --json
genvm-lint check contracts/settlement_gate.py --json
npm run test:frontend
npm run typecheck
npm run build
```

The direct suite covers UP, DOWN, equal-price refund, one-sided refund, cutoff rejection, missing evidence, conflicting timestamps, idempotent settlement, finality idempotency/conflict, shared Silver metadata, position pagination within one market, filtered market history pagination, overlap prevention, post-deadline deterministic refund, bounded evidence bodies, and bounded evidence prices.

## Deploy

```powershell
genlayer network set studionet
npm run deploy
```

The deployment script deploys and binds both contracts, waits for finalized receipts, and writes `deploy/last-deployment.json` only after success. It prints `NEXT_PUBLIC_METAL_ARENA_ADDRESS`. No portal submission is performed by this repository.

## Bounded release evidence

The fresh StudioNet pair is recorded in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The controlled Gold interval used the exact future fixture `gold-2026-09-13-20-00-00Z`, completed the real 20:00–20:15 UTC window, settled through validator consensus, passed the separate finality gate, paid the UP claim, and rejected a duplicate claim. The production console is [`https://metal-arena.vercel.app`](https://metal-arena.vercel.app).

## Public completed-case proof

Open the recorded Gold case without a wallet at [`https://metal-arena.vercel.app/?case=gold-2026-09-13-20-00-00Z`](https://metal-arena.vercel.app/?case=gold-2026-09-13-20-00-00Z). The deployment-scoped public proof manifest is [`metal-arena-gold-case.json`](https://metal-arena.vercel.app/evidence/metal-arena-gold-case.json); it contains the verified market, accounting, deployed addresses, and public explorer links for settlement, payout, and the expected duplicate-claim rollback. This public proof is separate from browser-local transaction history.

The configured hosted release does not invite users to open unsupported new fixture intervals. A new market requires matching published evidence; preview controls are only available in an unconfigured local build.

## Readiness verdict

- Synthetic prototype: **YES** — fresh contracts, guarded lifecycle, on-chain paginated history, selectable historical positions, bounded settlement/finality polling, public fixture hosting, and a recorded full Gold journey are complete.
- Real-price trading: **NO** — no suitable public, validator-accessible exact 15-minute historical source was found in the time-box, and the app remains explicitly synthetic.

This is a testnet/demo-credit prototype, not financial advice or a production precious-metals venue.
