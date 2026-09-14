# External price-source investigation

Investigation date: `2026-09-14` (time-boxed to 20 minutes). No external source was integrated into settlement. The existing `synthetic-boundary-v1` policy remains the only shipped policy because every candidate failed at least one required gate: exact historical boundary availability, independently verifiable provenance, validator access without a secret, or permitted settlement use.

## Candidate results

### XAUS intraday XAU/USD

The public request [`https://xaus.com/api/v1/intraday?symbol=xau&hours=48`](https://xaus.com/api/v1/intraday?symbol=xau&hours=48) returned JSON without credentials. The observed response identified `symbol: xau`, `currency: USD`, `unit: troy_oz`, `interval_seconds: 120`, and `source: xaus-sampler (gold-api.com)`. It returned 347 points covering about 11.5 hours despite the 48-hour request; the observed first and last timestamps were `2026-09-13T22:00:21Z` and `2026-09-14T09:32:02Z`.

The service documents 14-day retention for this sampled series and describes the values as indicative mid-market rates. It explicitly says they are not tradable quotes and should not be used for settlement, execution, or contractual valuation. The payload exposes the operator sampler rather than independently verifiable upstream trade/benchmark provenance. This is useful source research, but it is not acceptable as MetalArena settlement evidence.

### goldprice.dev 15-minute bars

The actual request [`https://api.goldprice.dev/v1/bars?symbol=XAU-USD-SPOT&interval=15m&from=2026-09-13T20:00:00Z&to=2026-09-13T20:30:00Z`](https://api.goldprice.dev/v1/bars?symbol=XAU-USD-SPOT&interval=15m&from=2026-09-13T20:00:00Z&to=2026-09-13T20:30:00Z) returned `plan_gated`, `tier: free`, and `interval=15m requires the Pro tier`. The public documentation says the free window exposes daily XAU-USD spot, while intraday intervals require Pro+. No paid plan or credential was used.

### Alpha Vantage Gold/Silver API

The actual unauthenticated demo requests for `GOLD_SILVER_SPOT` and `GOLD_SILVER_HISTORY` returned the service message requiring a claimed API key. The official documentation lists Gold/Silver historical intervals as `daily`, `weekly`, and `monthly`, not 15-minute history. It therefore cannot provide the required two boundary observations to validators without a secret and a different cadence.

### LBMA Gold Price

LBMA describes its Gold Price as an official benchmark set twice daily at 10:30 and 15:00 London time, published with a delay. That cadence cannot supply both boundaries of a generic 15-minute interval, and benchmark access/licensing is not an anonymous validator endpoint.

### Yahoo Finance `XAUUSD=X`

The actual chart request for `XAUUSD=X` at 15-minute resolution returned `No data found, symbol may be delisted`. A futures symbol such as `GC=F` was not substituted: futures are a different instrument and would violate the source-identity requirement.

## Decision and upgrade gate

No source above is suitable for the current contract’s independently retrieved, frozen settlement evidence. MetalArena therefore does not claim live or real-price settlement, does not relay an unsuitable quote into a fixture, and does not redeploy contracts for this investigation.

An external policy may only replace `synthetic-boundary-v1` after a future source proves all of the following with actual responses: named spot/benchmark identity, USD per troy ounce semantics and precision, historical observations at both boundaries, a stable validator-accessible URL without a secret, source provenance independent of the project operator, permitted display/settlement use, bounded request limits, and explicit missing/stale/conflicting evidence behavior.

The public Gold case remains explicitly labeled `HISTORICAL_REPLAY_SYNTHETIC`. Its frozen fixture is operator-supplied demonstration data; validator consensus, public receipts, contract state, finality-gate state, and accounting are independently readable proof of the mechanics only.
