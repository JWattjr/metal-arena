# Deployment evidence

## GenLayer Studio Network

Deployment completed on 2026-09-13 at `2026-09-13T18:19:27.122Z` using the official GenLayer CLI and the configured active test account. Chain ID: `61999`. This is the final deployment after the validator-disagreement retry hardening.

| Contract | Address |
| --- | --- |
| SettlementGate | `0xe7C3784b337B5f68b622Eeadd7ba1f0dE535d580` |
| MetalArena | `0x97A83ECBC86d277d3328973ed37367947De85418` |

Transactions:

- SettlementGate deploy: `0x6e0dfa0533114275cfc906615cdb0b8c9e96c38816667d2018c2b118550d7441`
- MetalArena deploy: `0x47ff7d4faa7a4ee21aa8edcea591c37bc728907b866fae279791ce72fa0cb44a`
- Gate → arena binding: `0xe4b9a6747e56ffe8273b7dd1362fe07a80ef06e9150f1b28ce028bee6ea04f38`
- Arena → gate binding: `0x709b5888a4429cfdc99d99134a015ba1115e5e714fe110597f7ad14ae3b29388`

Read-back evidence after deployment:

- `MetalArena.get_protocol_config()` returned `finality_gate_configured: true`, `fee_bps: 200`, `market_seconds: 900`, `price_scale: 1000000`, and `rule_version: synthetic-boundary-v1`.
- `SettlementGate.get_gate_status()` returned `arena_configured: true`, the arena address above, and `finalized_markets: 0`.

## Hosting and settlement-source limitation

The contract deliberately freezes evidence under `https://metal-arena.vercel.app/evidence/`. The local JSON fixtures are self-consistent and served by the frontend in development, but the public URL returned HTTP 404 during this run. The frontend was not published from this run, so no testnet market was opened or funded against an unavailable source.

The remaining launch action is to publish the `frontend` directory to an explicitly approved Vercel project/domain, verify the four fixture URLs publicly, and then run one controlled Gold interval end-to-end.
