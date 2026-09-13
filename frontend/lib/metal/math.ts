export type MathSide = "UP" | "DOWN";

export const FEE_BPS = 200;
export const BPS_DENOMINATOR = 10_000;

export function feeForPool(upPool: number, downPool: number) {
  const gross = Math.max(0, upPool) + Math.max(0, downPool);
  if (upPool <= 0 || downPool <= 0) return 0;
  return Math.floor((gross * FEE_BPS) / BPS_DENOMINATOR);
}

export function payoutFromPool(distributablePool: number, winningPool: number, stake: number) {
  if (distributablePool <= 0 || winningPool <= 0 || stake <= 0) return 0;
  return Math.floor((distributablePool * stake) / winningPool);
}

export function estimatePayout(upPool: number, downPool: number, side: MathSide, stake: number) {
  if (stake <= 0) return 0;
  const proposedUp = Math.max(0, upPool) + (side === "UP" ? stake : 0);
  const proposedDown = Math.max(0, downPool) + (side === "DOWN" ? stake : 0);
  const opposingPool = side === "UP" ? downPool : upPool;
  if (opposingPool <= 0) return 0;
  const fee = feeForPool(proposedUp, proposedDown);
  const distributable = proposedUp + proposedDown - fee;
  return payoutFromPool(distributable, side === "UP" ? proposedUp : proposedDown, stake);
}
