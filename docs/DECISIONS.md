# Decisions and limitations

## Why synthetic evidence is the shipped mode

The prototype needs exact 15-minute boundary observations, while the easily available public metal APIs discovered during implementation expose daily/weekly/monthly history or require a key. LBMA benchmark data is a licensed benchmark with limited publication cadence for this use case. A fabricated live feed would hide the most important settlement risk, so the app labels all fixtures and keeps the source policy explicit.

The upgrade path is to replace the frozen source policy only after confirming: exact boundary or an approved max-gap selection rule, spot versus futures semantics, historical retention, validator access, redistribution rights, and rate limits.

## Why demo credits

The user brief asks for a testnet prototype, not production custody. Demo credits make the pool math and finality flow testable without pretending that an unaudited contract holds deposits. The README and UI call this out wherever a user can stake or claim.

## Why integer math

Prices use six-decimal fixed-point integers. Stakes, fee amounts, pools, payouts, and claimed totals are integer values. The fee is `floor(gross_pool * 200 / 10_000)` and each proportional payout is floored; the remainder stays as locked dust instead of being silently over-distributed.

## Readiness boundary

The contracts, direct tests, and Studio deployment are prototype-ready. Production or public launch remains blocked until the synthetic source is replaced or explicitly accepted for a demo, the public evidence host is deployed at the contract's frozen URL, and one controlled Gold interval is exercised against that hosted source.
