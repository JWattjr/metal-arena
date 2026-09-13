# Decisions and limitations

## Why synthetic evidence is the shipped mode

The prototype needs exact 15-minute boundary observations, while the public sources checked during the release window did not provide a suitable validator-accessible feed. [LBMA Precious Metal Prices](https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices) describes benchmark publication/access constraints, while [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/) exposes gold/silver historical products at daily, weekly, and monthly intervals and requires a key. A fabricated live feed would hide the most important settlement risk, so the app labels all fixtures and keeps the source policy explicit.

The upgrade path is to replace the frozen source policy only after confirming: exact boundary or an approved max-gap selection rule, spot versus futures semantics, historical retention, validator access, redistribution rights, and rate limits.

## Why demo credits

The user brief asks for a testnet prototype, not production custody. Demo credits make the pool math and finality flow testable without pretending that an unaudited contract holds deposits. The README and UI call this out wherever a user can stake or claim.

## Why integer math

Prices use six-decimal fixed-point integers. Stakes, fee amounts, pools, payouts, and claimed totals are integer values. The fee is `floor(gross_pool * 200 / 10_000)` and each proportional payout is floored; the remainder stays as locked dust instead of being silently over-distributed.

## Readiness boundary

The contracts, direct tests, Studio deployment, public evidence host, on-chain history selection, and one controlled future Gold interval are prototype-ready. Synthetic prototype verdict: **YES**. Real-price trading verdict: **NO** until an exact 15-minute source is independently validated for retention, semantics, validator access, licensing, and rate limits.
