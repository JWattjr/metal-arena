import assert from "node:assert/strict";
import test from "node:test";

import { estimatePayout, feeForPool, payoutFromPool } from "../../frontend/lib/metal/math.ts";

test("two-sided fees use disclosed floor arithmetic", () => {
  assert.equal(feeForPool(300, 100), 8);
  assert.equal(feeForPool(300, 0), 0);
});

test("proportional payout floors without over-distributing", () => {
  assert.equal(payoutFromPool(392, 300, 300), 392);
  assert.equal(payoutFromPool(392, 300, 1), 1);
  assert.equal(payoutFromPool(392, 300, 0), 0);
});

test("preview estimate mirrors the contract's proposed pool", () => {
  assert.equal(estimatePayout(300, 100, "UP", 25), 32);
  assert.equal(estimatePayout(100, 300, "DOWN", 25), 32);
  assert.equal(estimatePayout(250, 0, "UP", 25), 0);
});
