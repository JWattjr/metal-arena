# MetalArena

MetalArena is a compact GenLayer testnet prototype for 15-minute Gold and Silver UP/DOWN prediction markets. The interface is a dark settlement console: market clock and synthetic trace on the left, entry/pool state and evidence details on the right, then history, positions, and the public settlement record below.

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
python -m pytest tests/direct/ -v
python -m genvm_linter contracts/metal_arena.py --json
python -m genvm_linter contracts/settlement_gate.py --json
npm run typecheck
npm run build
```

The direct suite covers UP, DOWN, equal-price refund, one-sided refund, cutoff rejection, missing evidence, conflicting timestamps, idempotent settlement, finality idempotency/conflict, and shared Silver metadata.

## Deploy

```powershell
genlayer network set studionet
npm run deploy
```

The deployment script deploys and binds both contracts, waits for finalized receipts, and writes `deploy/last-deployment.json` only after success. It prints `NEXT_PUBLIC_METAL_ARENA_ADDRESS`. No portal submission is performed by this repository.

## Readiness verdict

Prototype logic and UI: ready for a controlled testnet demo; both contracts are deployed and wired on GenLayer Studio Network. Production or public financial use: not ready. The remaining gates are an accepted real or explicitly approved demo evidence source, public hosting at the frozen evidence URL, and one controlled Gold interval against the hosted source. See `docs/DEPLOYMENT.md` for the recorded addresses, receipts, and limitation.
