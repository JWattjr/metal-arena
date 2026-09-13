# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: a small Next.js App Router prototype with a Python GenLayer Intelligent Contract and direct-mode tests, matching the existing workspace conventions.

## Users

People exploring a GenLayer testnet prototype who want to take a short, clearly labeled prediction position on whether a metal benchmark moves up or down over the next 15-minute UTC interval.

## Product Purpose

MetalArena lets users choose Gold or Silver, enter the upcoming 15-minute UP/DOWN market with demo credits, watch the current interval, and claim a protocol-finalized payout or refund. It is a prediction market, not ownership of physical metal.

## Positioning

The result is not selected by the frontend: GenLayer validators independently retrieve approved boundary evidence and agree on a strict canonical observation before deterministic contract code compares fixed-point prices and settles the pool.

## Operating Context

Markets use exactly 15-minute intervals aligned to UTC quarter-hours. Entry closes at the interval start while users can watch the current interval. Settlement is requested after expiry and claims depend on protocol-finalized settlement, not a provisional transaction status.

## Capabilities and Constraints

- Gold is the first market; Silver uses the same configuration-driven implementation.
- Each market has one named benchmark/instrument, explicit currency and unit, two independently funded sides, a disclosed fee, and integer arithmetic.
- Winning users share the distributable pool proportionally to their stakes. Equal normalized prices, a one-sided pool, missing/contradictory evidence, or an expired settlement deadline follow an explicit refund path; refunds pay no fee.
- The contract freezes market terms, rejects late entry and double claims, keeps settlement idempotent, and exposes lifecycle states from UPCOMING through CLAIMABLE or REFUNDED.
- Real-price settlement is an open limitation: public sources checked so far either lack exact intraday history, require a secret API key, or have licensing/access constraints. The first complete demo therefore uses clearly labeled synthetic fixtures; synthetic evidence must never be presented as live market data.
- Frontend chart data and browser storage are non-authoritative convenience layers only. Demo credits are not real funds and are not backed by physical metals.

## Brand Commitments

The product name is MetalArena. Copy must be direct about prediction positions, demo credits, synthetic evidence, source limitations, and finality status; it must not imply custody, ownership, profits, or live data where those facts are unavailable.

## Evidence on Hand

- The build brief is the authoritative product specification for the prototype.
- LBMA documentation confirms the recognized gold/silver benchmarks are low-frequency and licensing-controlled for historical/redistributed use; it does not satisfy exact 15-minute settlement boundaries for this demo.
- Alpha Vantage documents dedicated gold/silver spot and historical APIs, but historical commodity data is daily/weekly/monthly and access requires an API key. A no-secret historical source remains to be proven.

## Product Principles

- Make the market mechanism legible before asking for a stake.
- Keep the frontend observational; keep adjudication and payout arithmetic on-chain.
- Treat missing evidence as pending or refund, never as a guessed winner.
- Make provisional acceptance, protocol finality, settlement, and claims visibly distinct.
- Label every synthetic or illustrative value at the point of use.

## Accessibility & Inclusion

The web UI should support keyboard operation, visible focus, semantic controls, readable contrast, reduced-motion preferences, and explicit text labels for every status, price, unit, source, and action.
