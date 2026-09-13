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

The frontend is published to the approved Vercel project at [`https://metal-arena.vercel.app`](https://metal-arena.vercel.app). Production deployment `dpl_8FcZ2dC8QU5sm2nPYCT4vyjqKMwA` built successfully, the page returned HTTP 200, and the synthetic evidence policy marker was present.

The contract deliberately freezes evidence under `https://metal-arena.vercel.app/evidence/`. All four bundled fixtures returned HTTP 200 from the production domain with the hashes committed in `frontend/public/evidence/`:

- Gold 00:00: `sha256:16f61ec634f7344b7a954a0784b2abacd64b15c8d7bc22159da86c06b93d71c2`
- Gold 00:15: `sha256:c46c626150412cd51816ddbd04d561669d2a3980ce6ce73e3c5ea96728cf892a`
- Silver 00:00: `sha256:14d32c4feb44d262985e024c6616f155756293fc94949917a05580515f8879be`
- Silver 00:15: `sha256:1d5eae412775e9d8f3805afee9078e775bddcd8088f9610f9b2281beb3b6668d`

The remaining launch action is one controlled Gold interval end-to-end. The bundled examples are historical 2025 fixtures, while `open_next_market()` creates a current quarter-hour market id, so a live test requires provisioning an exact future fixture (or replacing the synthetic source) before the interval starts. No market was opened or funded against a mismatched source during this run.
