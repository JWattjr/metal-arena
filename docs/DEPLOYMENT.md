# Deployment evidence

## Fresh GenLayer Studio Network release

The bounded release was deployed on 2026-09-13 using the official GenLayer CLI and the active unlocked test account. Chain ID: `61999`. The deployment script waited for finalized receipts and checked successful contract execution for every step.

| Contract | Address |
| --- | --- |
| SettlementFinalityGate | `0xD4Dc9acFdE859Ca8b2c3D37d2d63630e3ef49254` |
| MetalArena | `0x8a583769Ab90bD7B2ad5689EA7Ded3EFe5818B25` |

Deployment transactions:

- Gate deploy: `0xa3a58d33201e71161b49339a0e1332d79c8394b01b62b3b778e00c947a4de41f`
- Arena deploy: `0xddca3b8bcfd86e88200ddfdc5f02d89089276e37788bd234697ef5b8786355de`
- Gate → arena binding: `0xa4f763ca80adbf7ebcf751b68b30145db4761db6af60c0e7c29196487f295e3f`
- Arena → gate binding: `0x175fe625ce27ad5b7156244c38ccba32d5180af12e5d6052763589f58c73d39d`

Deployment read-back returned `finality_gate_configured: true`, `market_seconds: 900`, `settlement_grace_seconds: 300`, `fee_bps: 200`, `price_scale: 1000000`, `source_id: metal-arena-synthetic-fixture-v1`, and `rule_version: synthetic-boundary-v1`. The generated record is also stored in [`deploy/last-deployment.json`](../deploy/last-deployment.json).

## Public hosting

The production alias is [`https://metal-arena.vercel.app`](https://metal-arena.vercel.app). The final release deployment is `dpl_B2eC5Dy5afpAoMUuBqRSTX6LjU9N`, built successfully, returned HTTP 200, and rendered the synthetic evidence policy marker. The exact future fixture returned HTTP 200 at [`gold-2026-09-13-20-00-00Z.json`](https://metal-arena.vercel.app/evidence/gold-2026-09-13-20-00-00Z.json).

## Public completed-case proof

The recommended wallet-free entry point is the stable [completed Gold case](https://metal-arena.vercel.app/?case=gold-2026-09-13-20-00-00Z). The deployment-scoped [public proof manifest](https://metal-arena.vercel.app/evidence/metal-arena-gold-case.json) is the canonical list of verified deployment, binding, journey, market, accounting, and explorer references. It is intentionally distinct from browser-local transaction history.

Key public links:

- [MetalArena contract](https://explorer-studio.genlayer.com/address/0x8a583769Ab90bD7B2ad5689EA7Ded3EFe5818B25)
- [SettlementFinalityGate contract](https://explorer-studio.genlayer.com/address/0xD4Dc9acFdE859Ca8b2c3D37d2d63630e3ef49254)
- [Settlement receipt](https://explorer-studio.genlayer.com/tx/0xf22b8e9404ea0eb9b237c1203084daeec1a0036b42186d75f4a8734b86051edc)
- [UP payout receipt](https://explorer-studio.genlayer.com/tx/0x05f92b9a6a0b307838d212b0ccc73df4a63833c87ab1cd842295c3af36273b6a)
- [Expected duplicate-claim rollback](https://explorer-studio.genlayer.com/tx/0x1108c3397fbf4a1f81f3aa1e3db4e30ddbd13ae762b51f520f73332b106c42a3)

Public read-only RPC receipt checks confirmed all 11 deployment, binding, and recorded-journey transactions in the manifest are finalized: 10 have successful execution and the duplicate claim finalized with the expected `position already claimed` error. The selected market, arena and gate addresses, finality read-back, evidence hash, pool accounting, and final account read-back match the manifest.

Fixture hashes currently covered by the repository tests:

- Gold 00:00: `sha256:16f61ec634f7344b7a954a0784b2abacd64b15c8d7bc22159da86c06b93d71c2`
- Gold 00:15: `sha256:c46c626150412cd51816ddbd04d561669d2a3980ce6ce73e3c5ea96728cf892a`
- Gold 2026-09-13 20:00: `sha256:0490a4a26a45a26e5c76ecaba601d67608a24f758d765eb67893184517f55914`
- Silver 00:00: `sha256:14d32c4feb44d262985e024c6616f155756293fc94949917a05580515f8879be`
- Silver 00:15: `sha256:1d5eae412775e9d8f3805afee9078e775bddcd8088f9610f9b2281beb3b6668d`

## Controlled Gold journey

The journey used the actual unlocked StudioNet sender `0xdB433ff614bDD1ecE21Aa97221C3E0a7ecf79c92`. The CLI account display address differed in casing/derivation from the sender shown in receipts; all state and transaction evidence below uses the receipt sender.

Market: `gold-2026-09-13-20-00-00Z`

Interval: `2026-09-13T20:00:00Z` → `2026-09-13T20:15:00Z`

Settlement deadline: `2026-09-13T20:20:00Z`

Evidence: [`gold-2026-09-13-20-00-00Z.json`](https://metal-arena.vercel.app/evidence/gold-2026-09-13-20-00-00Z.json)
Evidence hash: `sha256:0490a4a26a45a26e5c76ecaba601d67608a24f758d765eb67893184517f55914`

| Action | Receipt timestamp | Transaction | Result |
| --- | --- | --- | --- |
| Claim 1,000 demo credits | `2026-09-13T19:41:59Z` | `0xadc0dafa0e30cd767b4b54db8699861023c1e27a93bc590c1962297af421c569` | Finalized, execution succeeded |
| Open next Gold market | `2026-09-13T19:45:29Z` | `0xbd443f93b1dfe92b06cd923bf2667101b8c7d815e933fcb280534e0e19aa097c` | Finalized, execution succeeded |
| Stake UP 600 | `2026-09-13T19:46:09Z` | `0x954d2828305ffd65bb603e15123698def44e2bc3fa2e1b3462cfc51b8b559a51` | Finalized, execution succeeded |
| Stake DOWN 400 | `2026-09-13T19:46:35Z` | `0x265dae73856032d2ade58ba2f4b07225905f76bef0ceace2faa9f8b05e6c3ace` | Finalized, execution succeeded |
| Request settlement after expiry | `2026-09-13T20:15:51Z` | `0xf22b8e9404ea0eb9b237c1203084daeec1a0036b42186d75f4a8734b86051edc` | Finalized, validator consensus succeeded |
| Claim UP payout | `2026-09-13T20:17:35Z` | `0x05f92b9a6a0b307838d212b0ccc73df4a63833c87ab1cd842295c3af36273b6a` | Finalized, execution succeeded |
| Repeat UP claim | `2026-09-13T20:17:59Z` | `0x1108c3397fbf4a1f81f3aa1e3db4e30ddbd13ae762b51f520f73332b106c42a3` | Finalized rollback: `[EXPECTED] position already claimed` |

Settlement read-back: opening `3360000000`, closing `3361000000`, outcome `UP`, total pool `1000`, fee `20`, distributable pool `980`, attempt `1`, evidence status `FINALIZED`. The gate read-back became `finalized:true` at `2026-09-13T20:16:28.213547Z` with the same outcome, pool, URL, and evidence hash. The safe finality retry path is implemented and covered by direct gate idempotence/conflict tests; it was not needed for this run because the callback arrived during bounded polling.

Final account read-back: demo balance `980`, claimed payouts `980`, position count `2`. The UP position is claimed with payout `980`; the DOWN position remains separately represented with payout `0`.

## Browser journey evidence

The production page was opened in the Codex in-app browser after deployment. The settled read-only smoke showed:

- `Synthetic evidence policy is active` and the configured `Testnet prototype` marker;
- on-chain `Market history · 1` with a selectable Gold row for the exact 20:00 interval;
- the Gold fixture source link, exact opening/closing observations, and `FINALIZED` finality;
- the deployment-scoped public settlement, payout, and expected duplicate-claim links, even when no wallet session has locally recorded a transaction; browser-local references remain separately labeled.

The configured release does not offer an unsupported `open_next_market` path. The completed Gold case is the supported demo entry point; another hosted interval is not presented until matching evidence is published.

## Source assessment and readiness

The source check was time-boxed. [LBMA Precious Metal Prices](https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices) documents benchmark publication/access constraints and does not provide the exact public 15-minute historical feed required here. [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/) exposes gold/silver spot/history at daily, weekly, and monthly intervals and requires an API key. No suitable public, validator-accessible exact 15-minute historical source was found within the release window, so synthetic evidence remains explicit.

Final verdict: **synthetic prototype YES; real-price trading ready NO**.
