export type Metal = "GOLD" | "SILVER";
export type Side = "UP" | "DOWN";

export type MarketRecord = {
  exists: boolean;
  market_id: string;
  metal: Metal;
  instrument: string;
  currency: string;
  unit: string;
  price_scale: string | number | bigint;
  start_at: string;
  end_at: string;
  evidence_url: string;
  source_id: string;
  rule_version: string;
  fee_bps: string | number | bigint;
  up_pool: string | number | bigint;
  down_pool: string | number | bigint;
  total_staked: string | number | bigint;
  settlement_state: string;
  settlement_attempts: string | number | bigint;
  settlement_deadline: string;
  last_reason_code: string;
  opening_timestamp: string;
  closing_timestamp: string;
  opening_price: string | number | bigint;
  closing_price: string | number | bigint;
  evidence_hash: string;
  outcome: string;
  distributable_pool: string | number | bigint;
  fee_amount: string | number | bigint;
  claimed_amount: string | number | bigint;
  finality_status: string;
  status: string;
  created_at: string;
};

export type MarketPageRecord = {
  market_ids: string[];
  total: string | number | bigint;
  offset: string | number | bigint;
  limit: string | number | bigint;
  next_offset: string | number | bigint;
  has_more: boolean;
};

export type PositionRecord = {
  exists: boolean;
  market_id: string;
  owner: string;
  side: Side;
  stake: string | number | bigint;
  claimed: boolean;
  payout: string | number | bigint;
  entered_at: string;
};

export type QuoteRecord = {
  exists: boolean;
  market_id: string;
  side: Side;
  stake: string | number | bigint;
  payout: string | number | bigint;
  claimed: boolean;
  finality_status: string;
  rounding_policy: string;
};

export type AccountRecord = {
  owner: string;
  demo_balance: string | number | bigint;
  demo_credits_claimed: boolean;
  position_count: string | number | bigint;
  total_staked: string | number | bigint;
  claimed_payouts: string | number | bigint;
};

export type PositionPageRecord = {
  positions: PositionRecord[];
  total_markets: string | number | bigint;
  total_positions: string | number | bigint;
  offset: string | number | bigint;
  limit: string | number | bigint;
  next_offset: string | number | bigint;
  has_more: boolean;
};

export type ProtocolConfig = {
  fee_bps: string | number | bigint;
  fee_percent_display: string;
  price_scale: string | number | bigint;
  market_seconds: string | number | bigint;
  settlement_grace_seconds: string | number | bigint;
  rounding_policy: string;
  refund_policy: string;
  source_id: string;
  source_base_url: string;
  evidence_schema_version: string;
  rule_version: string;
  demo_credits_per_claim: string | number | bigint;
  finality_gate_configured: boolean;
};

export type TxSnapshot = {
  hash: string;
  status: string;
  execution: string;
  success: boolean;
  error?: string;
  action?: string;
  market_id?: string;
  network?: string;
  contract?: string;
  updated_at?: string;
};
