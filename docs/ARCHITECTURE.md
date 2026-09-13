# Architecture

## Runtime boundary

The browser is an observer and transaction composer. It can display synthetic chart fixtures, read contract state, connect MetaMask, and wait for finalized receipts. It is never the source of truth for a balance, pool, outcome, payout, or settlement record.

`MetalArena` stores the market lifecycle, pools, positions, and integer arithmetic. After the interval ends, `request_settlement` runs a GenLayer consensus boundary: the leader fetches the frozen evidence URL, every validator independently fetches and validates the same strict schema, and the result is accepted only when the validator comparison agrees.

The accepted evidence contains exact UTC boundary timestamps and positive fixed-point prices. The contract compares those integers, determines `UP`, `DOWN`, or `REFUND`, computes the disclosed 2% fee only for two-sided non-ties, and emits the finality callback.

`SettlementGate` is a deliberately small second contract. Its idempotent record is the protocol finality boundary used by `claim`, so a provisional consensus settlement is not enough to release a payout.

## State flow

```text
UPCOMING → LIVE → AWAITING_SETTLEMENT
                         │
             evidence consensus / retry
                         │
              SETTLED_PROVISIONAL
                         │ finality callback
                         ▼
                    CLAIMABLE
```

Missing, malformed, contradictory, or unavailable evidence produces `PENDING_EVIDENCE` with a bounded retry count. If the deadline passes, the market refunds all stakes without charging a fee and still requires finality before claims.

## Evidence policy

The current policy is intentionally a public synthetic fixture policy. It is not a claim that the values are live or licensed financial benchmark data. Each JSON record binds:

- metal, instrument, currency, and unit;
- exact opening/closing timestamps;
- integer prices and `max_gap_seconds = 0`;
- frozen source URL and rule version;
- a SHA-256 hash over the canonical payload.

The source base URL is compiled into the contract so a caller cannot redirect settlement to a different URL at market creation time.
