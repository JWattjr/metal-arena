# Portal description

## MetalArena

MetalArena is a GenLayer testnet prototype for 15-minute Gold and Silver UP/DOWN markets. Traders choose a side before the exact UTC quarter-hour cutoff and join a two-sided pari-mutuel pool using demo credits. After expiry, GenLayer validators independently retrieve a frozen evidence record, verify the metal, instrument, currency, unit, timestamps, source, and schema, and the deterministic contract compares fixed-point prices to produce `UP`, `DOWN`, or `REFUND`. Claims are released only after the settlement finality gate records the finalized callback.

The console is intentionally transparent about its current synthetic evidence policy. It shows the interval clock, pool estimates, lifecycle, evidence record, rounding/fee rules, position state, and finality status without fabricating live volume, traders, or profits.

This is a prototype with demo credits. It is not financial advice, a live precious-metals venue, or a production benchmark integration.
