"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CircleAlert,
  CircleHelp,
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
  Gauge,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { formatAddress, useWallet } from "@/lib/genlayer/WalletProvider";
import { isMetalArenaConfigured, MetalArenaClient } from "@/lib/metal/client";
import { estimatePayout } from "@/lib/metal/math";
import type { AccountRecord, MarketRecord, Metal, PositionRecord, ProtocolConfig, QuoteRecord, Side, TxSnapshot } from "@/lib/metal/types";

type Point = { time: string; value: number };
type PreviewPools = { UP: number; DOWN: number };
type UiMessage = { tone: "info" | "success" | "error" | "warning"; text: string } | null;

const METALS: Record<Metal, { name: string; symbol: string; detail: string; source: string; accent: string }> = {
  GOLD: {
    name: "Gold",
    symbol: "XAU / USD",
    detail: "Synthetic XAU/USD spot replay · USD per troy ounce",
    source: "Synthetic fixture · historical replay",
    accent: "gold",
  },
  SILVER: {
    name: "Silver",
    symbol: "XAG / USD",
    detail: "Synthetic XAG/USD spot replay · USD per troy ounce",
    source: "Synthetic fixture · historical replay",
    accent: "silver",
  },
};

const CHART_POINTS: Record<Metal, Point[]> = {
  GOLD: [
    { time: "08:45", value: 3361.8 },
    { time: "08:50", value: 3364.4 },
    { time: "08:55", value: 3362.1 },
    { time: "09:00", value: 3367.2 },
    { time: "09:05", value: 3369.1 },
    { time: "09:10", value: 3367.6 },
    { time: "09:15", value: 3371.5 },
    { time: "09:20", value: 3373.8 },
  ],
  SILVER: [
    { time: "08:45", value: 32.18 },
    { time: "08:50", value: 32.24 },
    { time: "08:55", value: 32.17 },
    { time: "09:00", value: 32.31 },
    { time: "09:05", value: 32.28 },
    { time: "09:10", value: 32.35 },
    { time: "09:15", value: 32.41 },
    { time: "09:20", value: 32.39 },
  ],
};

const HISTORICAL: Record<Metal, Array<{ id: string; interval: string; outcome: "UP" | "DOWN" | "REFUND"; observations: string; note: string }>> = {
  GOLD: [
    { id: "gold-2025-01-01-00-00-00Z", interval: "01 Jan 2025 · 00:00 UTC", outcome: "UP", observations: "$2,100.00 → $2,101.00", note: "Synthetic fixture · not a live interval" },
    { id: "gold-2025-01-01-00-15-00Z", interval: "01 Jan 2025 · 00:15 UTC", outcome: "REFUND", observations: "Equal boundary prices", note: "Synthetic fixture · refund path" },
  ],
  SILVER: [
    { id: "silver-2025-01-01-00-00-00Z", interval: "01 Jan 2025 · 00:00 UTC", outcome: "DOWN", observations: "$29.40 → $29.37", note: "Synthetic fixture · not a live interval" },
    { id: "silver-2025-01-01-00-15-00Z", interval: "01 Jan 2025 · 00:15 UTC", outcome: "REFUND", observations: "One-sided pool", note: "Synthetic fixture · refund path" },
  ],
};

function toIso(seconds: number) {
  return new Date(seconds * 1000).toISOString().slice(0, 19) + "Z";
}

function nextQuarter(seconds: number) {
  return Math.floor(seconds / 900) * 900 + 900;
}

function marketId(metal: Metal, startSeconds: number) {
  const iso = toIso(startSeconds);
  return `${metal.toLowerCase()}-${iso.slice(0, 10)}-${iso.slice(11, 13)}-${iso.slice(14, 16)}-${iso.slice(17, 19)}Z`;
}

function timestampLabel(value: string, withDate = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    timeZone: "UTC",
    ...(withDate ? { month: "short", day: "2-digit" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", " ·");
}

function countdown(targetSeconds: number, nowSeconds: number) {
  if (!nowSeconds || !targetSeconds) return "--:--";
  const remaining = Math.max(0, targetSeconds - nowSeconds);
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function integerValue(value: string | number | bigint | undefined | null): bigint {
  if (value === undefined || value === null || value === "") return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function credits(value: string | number | bigint | undefined | null) {
  return integerValue(value).toLocaleString("en-US");
}

function price(value: string | number | bigint | undefined | null, scale = 1_000_000, fallback = "—") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  try {
    const raw = integerValue(value);
    const divisor = BigInt(scale);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionText = fraction.toString().padStart(6, "0").replace(/0+$/, "");
    return `$${whole.toLocaleString("en-US")}${fractionText ? `.${fractionText}` : ""}`;
  } catch {
    return fallback;
  }
}

function safeAmount(value: string) {
  if (!/^\d+$/.test(value.trim())) return 0n;
  return BigInt(value.trim());
}

function statusClass(value: string) {
  const normalized = value.toUpperCase();
  if (normalized.includes("FINAL") || normalized === "CLAIMABLE") return "green";
  if (normalized.includes("PENDING") || normalized.includes("AWAITING")) return "amber";
  if (normalized === "LIVE") return "cyan";
  if (normalized === "REFUND" || normalized === "REFUNDED") return "amber";
  return "gold";
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^| )\S/g, (letter) => letter.toUpperCase());
}

function outcomeClass(value: string) {
  if (value === "UP") return "outcome-up";
  if (value === "DOWN") return "outcome-down";
  return "outcome-refund";
}

function lifecycleStatus(market: MarketRecord | null, fallback: string) {
  return market?.status || fallback;
}

function previewMarket(metal: Metal, nowSeconds: number, pools: PreviewPools): MarketRecord {
  const start = nextQuarter(nowSeconds || Math.floor(Date.now() / 1000));
  return {
    exists: true,
    market_id: `preview-${marketId(metal, start)}`,
    metal,
    instrument: METALS[metal].symbol,
    currency: "USD",
    unit: "USD_PER_TROY_OUNCE",
    price_scale: 1_000_000,
    start_at: toIso(start),
    end_at: toIso(start + 900),
    evidence_url: `/evidence/${metal.toLowerCase()}-2025-01-01-00-00-00Z.json`,
    source_id: "metal-arena-synthetic-fixture-v1",
    rule_version: "synthetic-boundary-v1",
    fee_bps: 200,
    up_pool: pools.UP,
    down_pool: pools.DOWN,
    total_staked: pools.UP + pools.DOWN,
    settlement_state: "AWAITING_SETTLEMENT",
    settlement_attempts: 0,
    settlement_deadline: toIso(start + 1200),
    last_reason_code: "",
    opening_timestamp: "",
    closing_timestamp: "",
    opening_price: 0,
    closing_price: 0,
    evidence_hash: "",
    outcome: "",
    distributable_pool: 0,
    fee_amount: 0,
    claimed_amount: 0,
    finality_status: "NOT_STARTED",
    status: "UPCOMING",
    created_at: toIso(nowSeconds || start - 900),
  };
}

function chartPath(points: Point[]) {
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const padding = (max - min) * 0.18 || 1;
  const low = min - padding;
  const high = max + padding;
  return points.map((point, index) => {
    const x = 72 + (index / Math.max(1, points.length - 1)) * 880;
    const y = 245 - ((point.value - low) / (high - low)) * 196;
    return { ...point, x, y };
  });
}

function LineChart({ metal }: { metal: Metal }) {
  const geometry = chartPath(CHART_POINTS[metal]);
  const line = geometry.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const min = Math.min(...CHART_POINTS[metal].map((point) => point.value));
  const max = Math.max(...CHART_POINTS[metal].map((point) => point.value));
  const last = geometry[geometry.length - 1];
  const accent = METALS[metal].accent === "silver" ? " silver" : "";
  return (
    <div className="chart-stage" aria-label={`${METALS[metal].name} synthetic benchmark replay chart`}>
      <svg className="chart-svg" viewBox="0 0 1000 300" role="img">
        {[49, 98, 147, 196, 245].map((y, index) => <line key={y} x1="72" x2="960" y1={y} y2={y} className={`chart-grid ${index === 2 ? "major" : ""}`} />)}
        {[72, 294, 516, 738, 960].map((x) => <line key={x} x1={x} x2={x} y1="28" y2="267" className="chart-grid" />)}
        <line x1={last.x} x2={last.x} y1="28" y2="267" className="chart-marker" />
        <path d={line} className={`chart-line${accent}`} />
        {geometry.map((point) => <circle key={point.time} cx={point.x} cy={point.y} r="3.5" className={`chart-point${accent}`} />)}
        <text x="12" y="53" className="chart-label">{price(max, 1, String(max))}</text>
        <text x="12" y="247" className="chart-label">{price(min, 1, String(min))}</text>
        <text x={Math.max(80, last.x - 32)} y={Math.max(22, last.y - 13)} className="chart-note">last fixture</text>
        {geometry.filter((_point, index) => index % 2 === 0).map((point) => <text key={`label-${point.time}`} x={point.x - 16} y="286" className="chart-label">{point.time}</text>)}
      </svg>
    </div>
  );
}

function StatusBadge({ value, tone }: { value: string; tone?: string }) {
  return <span className={`status-badge ${tone || statusClass(value)}`}>{statusLabel(value)}</span>;
}

function Header({ metal, setMetal, onConnect, walletAddress, connected, connecting, configured }: {
  metal: Metal;
  setMetal: (metal: Metal) => void;
  onConnect: () => void;
  walletAddress: string | null;
  connected: boolean;
  connecting: boolean;
  configured: boolean;
}) {
  return (
    <header className="site-header">
      <div className="header-left">
        <div className="brand" aria-label="MetalArena home">
          <span className="brand-mark">MA</span>
          <span className="brand-wordmark">MetalArena<span className="brand-subtitle">settlement console</span></span>
        </div>
        <div className="header-switcher" role="tablist" aria-label="Metal market">
          {(["GOLD", "SILVER"] as Metal[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={metal === item} className={`metal-option ${METALS[item].accent} ${metal === item ? "active" : ""}`} onClick={() => setMetal(item)}>
              <span className="metal-dot" /> {METALS[item].name}
            </button>
          ))}
        </div>
      </div>
      <div className="header-right">
        <div className="network-status" title={configured ? "Contract address configured" : "No deployed contract configured"}>
          <span className={`network-dot ${configured ? "" : "offline"}`} />
          <span>{configured ? "Testnet prototype" : "Preview mode"}</span>
        </div>
        <button type="button" className={`wallet-button ${connected ? "connected" : ""}`} onClick={onConnect} disabled={connecting}>
          <WalletCards size={14} />
          {connecting ? "Checking…" : connected ? formatAddress(walletAddress, 15) : "Connect wallet"}
        </button>
      </div>
    </header>
  );
}

function DemoBanner({ configured }: { configured: boolean }) {
  return (
    <div className="demo-banner" role="note">
      <Info size={16} />
      <div>
        <strong>{configured ? "Synthetic evidence policy is active" : "Synthetic evidence preview"}</strong>
        <p>{configured ? "This deployment uses public historical fixtures, not live metal prices. A real-price source remains blocked by licensing, key, and intraday-history constraints." : "No MetalArena contract is configured in this build. Controls below are an in-memory preview only; no ledger, balance, settlement, or transaction is being simulated as final."}</p>
      </div>
    </div>
  );
}

function IntervalStrip({ market, nowSeconds }: { market: MarketRecord; nowSeconds: number }) {
  const start = Math.floor(new Date(market.start_at).getTime() / 1000);
  const end = Math.floor(new Date(market.end_at).getTime() / 1000);
  const current = market.status === "UPCOMING" ? start : end;
  return (
    <div className="interval-strip">
      <div className="interval-side">
        <span className="interval-label">Entry opens until</span>
        <span className="interval-time">{timestampLabel(market.start_at, true)} UTC</span>
      </div>
      <div className="countdown" aria-live="polite">
        <strong>{countdown(current, nowSeconds)}</strong>
        <span>{market.status === "UPCOMING" ? "to lock" : "to expiry"}</span>
      </div>
      <div className="interval-side">
        <span className="interval-label">Interval end</span>
        <span className="interval-time">{timestampLabel(market.end_at, true)} UTC</span>
      </div>
    </div>
  );
}

function MarketPanel({ metal, market, nowSeconds }: { metal: Metal; market: MarketRecord; nowSeconds: number }) {
  const config = METALS[metal];
  const points = CHART_POINTS[metal];
  const last = points[points.length - 1].value;
  const first = points[0].value;
  const delta = ((last - first) / first) * 100;
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div className="panel-title"><Gauge size={16} /> Benchmark monitor</div>
        <span className="panel-label">5-minute display feed</span>
      </div>
      <div className="market-meta">
        <div className="benchmark-block">
          <span className={`metal-emblem ${config.accent}`}>{metal === "GOLD" ? "Au" : "Ag"}</span>
          <div>
            <p className="benchmark-name">{config.name} benchmark</p>
            <p className="benchmark-detail">{config.detail}</p>
          </div>
        </div>
        <div className="price-readout">
          <span className="price-value">{price(last, 1)}</span>
          <span className="price-change">{delta >= 0 ? "+" : ""}{delta.toFixed(2)}%</span>
          <div className="price-source">{config.source}</div>
        </div>
      </div>
      <LineChart metal={metal} />
      <div className="chart-legend">
        <div className="legend-group">
          <span className="legend-item"><span className={`legend-stroke ${config.accent === "silver" ? "silver" : ""}`} /> {config.symbol} display trace</span>
          <span className="legend-item"><span className="legend-stroke cyan" /> interval boundary</span>
        </div>
        <span className="data-disclaimer">synthetic replay · not live</span>
      </div>
      <IntervalStrip market={market} nowSeconds={nowSeconds} />
    </section>
  );
}

function PoolRow({ side, amount, total }: { side: Side; amount: number; total: number }) {
  const share = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="pool-row">
      <div className="pool-label">
        <span className={`pool-name ${side === "UP" ? "up" : "down"}`}>{side === "UP" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {side}</span>
        <span className="pool-amount">{amount.toLocaleString("en-US")} credits</span>
      </div>
      <div className="pool-bar"><div className={`pool-fill ${side === "DOWN" ? "down" : ""}`} style={{ width: `${Math.max(share, amount > 0 ? 2 : 0)}%` }} /></div>
      <div className="pool-foot"><span>{total > 0 ? `${share.toFixed(1)}% of pool` : "No stakes yet"}</span><span>variable until lock</span></div>
    </div>
  );
}

function Lifecycle({ status }: { status: string }) {
  const order = ["UPCOMING", "LIVE", "AWAITING_SETTLEMENT", "FINALIZED", "CLAIMABLE"];
  const normalized = status.toUpperCase();
  const current = normalized === "REFUNDED" ? 4 : normalized === "AWAITING_FINALITY" ? 3 : Math.max(0, order.indexOf(normalized));
  return (
    <div className="rail-section lifecycle-panel">
      <div className="detail-line"><h3>Market lifecycle</h3><StatusBadge value={status} /></div>
      <div className="timeline-row" aria-label={`Current market status: ${statusLabel(status)}`}>
        {order.map((step, index) => (
          <div key={step} className={`timeline-step ${index < current ? "done" : ""} ${index === current ? "current" : ""}`}>
            <span className="timeline-dot">{index < current ? <Check size={10} /> : index + 1}</span>
            <span>{step === "AWAITING_SETTLEMENT" ? "Evidence" : step === "CLAIMABLE" ? "Claim" : statusLabel(step)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntryPanel({
  metal,
  market,
  account,
  selectedSide,
  setSelectedSide,
  stakeAmount,
  setStakeAmount,
  previewBalance,
  onClaimCredits,
  onOpenMarket,
  onStake,
  busy,
  configured,
  connected,
  message,
}: {
  metal: Metal;
  market: MarketRecord | null;
  account: AccountRecord | null;
  selectedSide: Side;
  setSelectedSide: (side: Side) => void;
  stakeAmount: string;
  setStakeAmount: (amount: string) => void;
  previewBalance: number;
  onClaimCredits: () => void;
  onOpenMarket: () => void;
  onStake: () => void;
  busy: boolean;
  configured: boolean;
  connected: boolean;
  message: UiMessage;
}) {
  const upPool = Number(integerValue(market?.up_pool));
  const downPool = Number(integerValue(market?.down_pool));
  const amount = Number(safeAmount(stakeAmount));
  const opposingPool = selectedSide === "UP" ? downPool : upPool;
  const estimate = estimatePayout(upPool, downPool, selectedSide, amount);
  const balance = configured ? Number(integerValue(account?.demo_balance)) : previewBalance;
  const liveStatus = market ? market.status : "UNOPENED";
  const entryOpen = liveStatus === "UPCOMING";
  const canStake = entryOpen && amount > 0 && amount <= balance && !busy;
  const canClaimCredits = !busy && (configured ? connected && !account?.demo_credits_claimed : true);
  return (
    <section className="panel entry-panel">
      <div className="entry-header">
        <div>
          <span className="panel-label">Upcoming market</span>
          <h2 className="entry-title">{METALS[metal].name} / 15 min</h2>
        </div>
        <StatusBadge value={market ? liveStatus : "UNOPENED"} tone={market ? undefined : "amber"} />
      </div>
      <p className="entry-copy">Will this benchmark finish above its exact opening observation? Pick a side before the UTC quarter-hour cutoff.</p>
      {market ? <div className="pool-table"><PoolRow side="UP" amount={upPool} total={upPool + downPool} /><PoolRow side="DOWN" amount={downPool} total={upPool + downPool} /></div> : <div className="empty-state"><Clock3 size={18} /><h3>No upcoming market is open</h3><p>Open the next aligned quarter-hour from the deployed contract.</p></div>}
      <div className="entry-controls">
        <label className="control-label" htmlFor="side-select">Prediction position</label>
        <div className="choice-row" id="side-select">
          {(["UP", "DOWN"] as Side[]).map((side) => (
            <button key={side} type="button" className={`side-choice ${selectedSide === side ? `selected ${side.toLowerCase()}` : ""}`} onClick={() => setSelectedSide(side)} disabled={!market || !entryOpen}>
              <span className="choice-direction">{side === "UP" ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />} {side}</span>
              <span>{side === "UP" ? "above" : "below"}</span>
            </button>
          ))}
        </div>
        <label className="control-label" htmlFor="stake-amount" style={{ marginTop: 15 }}>Stake amount</label>
        <div className="stake-field">
          <input id="stake-amount" className="stake-input" inputMode="numeric" pattern="[0-9]*" value={stakeAmount} onChange={(event) => setStakeAmount(event.target.value.replace(/\D/g, ""))} disabled={!market || !entryOpen || busy} aria-describedby="stake-note" />
          <span className="stake-unit">demo credits</span>
        </div>
        <div className="estimate"><span>Estimated payout if {selectedSide} wins</span><strong>{estimate > 0 ? `${estimate.toLocaleString("en-US")} credits` : "—"}</strong></div>
        <p id="stake-note" className="estimate-note">{opposingPool === 0 ? "One-sided pool: any stake remains refundable until both sides are funded." : "Payout is variable until entry closes. Fee: 2% of the distributable pool."}</p>
        <div className="action-row">
          <button type="button" className={`primary-action ${METALS[metal].accent === "silver" ? "silver-action" : ""}`} onClick={onStake} disabled={!canStake}>{busy ? "Waiting…" : configured && !connected ? "Connect to enter" : `Stake ${selectedSide}`}</button>
          <button type="button" className="secondary-action" onClick={onClaimCredits} disabled={!canClaimCredits}>{configured && account?.demo_credits_claimed ? "Credits claimed" : "Get 1,000 credits"}</button>
        </div>
        {!market ? <button type="button" className="ghost-action" style={{ width: "100%", marginTop: 10 }} onClick={onOpenMarket} disabled={busy}>{configured ? connected ? "Open next market" : "Connect to open market" : "Open preview market"}</button> : null}
        {message ? <div className={`action-message ${message.tone === "error" ? "error" : ""}`}><CircleAlert size={14} /><span>{message.text}</span></div> : null}
      </div>
      <div className="rail-section">
        <div className="detail-line"><span>Available to stake</span><span className="detail-value">{balance.toLocaleString("en-US")} credits</span></div>
        <div className="detail-line"><span>Market terms</span><span className="detail-value cyan">15m · UTC aligned</span></div>
        <div className="detail-line"><span>Funds</span><span className="detail-value muted">Demo credits only</span></div>
      </div>
    </section>
  );
}

function EvidencePanel({ metal, market, protocol }: { metal: Metal; market: MarketRecord; protocol: ProtocolConfig | null }) {
  const opening = market.opening_price ? price(market.opening_price, Number(integerValue(market.price_scale)) || 1_000_000) : "Awaiting evidence";
  const closing = market.closing_price ? price(market.closing_price, Number(integerValue(market.price_scale)) || 1_000_000) : "Awaiting evidence";
  return (
    <section className="panel full-width">
      <div className="panel-heading"><div className="panel-title"><FileCheck2 size={16} /> Public settlement record</div><span className="panel-label">validator evidence</span></div>
      <div className="panel-body">
        <div className="evidence-grid">
          <div className="detail-line"><span>Benchmark</span><span className="detail-value">{METALS[metal].symbol} · {METALS[metal].name}</span></div>
          <div className="detail-line"><span>Rule version</span><span className="detail-value">{market.rule_version || protocol?.rule_version || "synthetic-boundary-v1"}</span></div>
          <div className="detail-line"><span>Opening observation</span><span className="detail-value">{opening}{market.opening_timestamp ? ` · ${timestampLabel(market.opening_timestamp, true)} UTC` : ""}</span></div>
          <div className="detail-line"><span>Closing observation</span><span className="detail-value">{closing}{market.closing_timestamp ? ` · ${timestampLabel(market.closing_timestamp, true)} UTC` : ""}</span></div>
          <div className="detail-line"><span>Evidence source</span><span className="detail-value"><a href={market.evidence_url} target="_blank" rel="noreferrer">{market.source_id || protocol?.source_id || "Synthetic fixture"} <ExternalLink size={11} /></a></span></div>
          <div className="detail-line"><span>Selection rule</span><span className="detail-value">Exact boundary · max gap 0s</span></div>
          <div className="detail-line"><span>Transaction hash</span><span className="hash-value">Not submitted in preview</span></div>
          <div className="detail-line"><span>Finality</span><span className={`detail-value ${market.finality_status === "FINALIZED" ? "green" : "cyan"}`}>{market.finality_status || "Not finalized"}</span></div>
        </div>
        <p className="evidence-copy"><strong>Why validators matter:</strong> each validator retrieves the same frozen URL and verifies metal, instrument, currency, unit, timestamps, source identity, and schema. The contract alone compares the accepted fixed-point prices and performs the fee, payout, and refund arithmetic.</p>
      </div>
    </section>
  );
}

function HistoryPanel({ metal }: { metal: Metal }) {
  return (
    <section className="panel">
      <div className="panel-heading"><div className="panel-title"><Database size={16} /> Market history</div><span className="panel-label">fixtures only</span></div>
      <div className="history-list">
        {HISTORICAL[metal].map((item) => (
          <div className="history-row" key={item.id}>
            <div className="history-top"><span className="history-name">{METALS[metal].name} · {item.interval}</span><span className={`status-badge ${outcomeClass(item.outcome)}`}>{item.outcome}</span></div>
            <div className="history-sub">{item.observations}</div>
            <div className="history-meta"><span>{item.note}</span><span className="hash-value">{item.id}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PositionsPanel({ metal, market, positions, quotes, onClaim, configured, connected, busy }: { metal: Metal; market: MarketRecord; positions: Partial<Record<Side, PositionRecord | null>>; quotes: Partial<Record<Side, QuoteRecord | null>>; onClaim: (side: Side) => void; configured: boolean; connected: boolean; busy: boolean }) {
  const hasPosition = Boolean(positions.UP?.exists || positions.DOWN?.exists);
  return (
    <section className="panel">
      <div className="panel-heading"><div className="panel-title"><LockKeyhole size={16} /> My positions</div><span className="panel-label">{configured ? "contract read" : "preview state"}</span></div>
      {!hasPosition ? <div className="empty-state"><WalletCards size={18} /><h3>No position on this market</h3><p>Enter before the UTC cutoff. Your position is read from the configured contract when connected.</p></div> : <div className="position-list">
        {(["UP", "DOWN"] as Side[]).filter((side) => positions[side]?.exists).map((side) => {
          const position = positions[side]!;
          const quote = quotes[side];
          const claimable = market.finality_status === "FINALIZED" && !position.claimed;
          return <div className="position-row" key={side}><div className="position-line"><span className="position-name">{METALS[metal].name} / {side}</span><StatusBadge value={position.claimed ? "CLAIMED" : claimable ? "CLAIMABLE" : "AWAITING FINALITY"} /></div><div className="position-sub">Stake {credits(position.stake)} demo credits · entered {timestampLabel(position.entered_at, true)} UTC</div><div className="position-meta"><span>Quote {quote?.exists ? `${credits(quote.payout)} credits` : "pending"}</span><button type="button" className="link-action" onClick={() => onClaim(side)} disabled={!configured || !connected || busy || !claimable}>{position.claimed ? "Claimed" : claimable ? "Claim payout" : "Waiting for finality"}</button></div></div>;
        })}
      </div>}
    </section>
  );
}

function AppFooter({ configured, tx }: { configured: boolean; tx: TxSnapshot | null }) {
  return (
    <div className="footer-row">
      <span>{configured ? "Reads are from the configured MetalArena contract." : "Preview controls do not submit transactions or create an authoritative ledger."}</span>
      <span>{tx ? `Last receipt · ${tx.status} · ${tx.success ? "execution succeeded" : "execution pending/failed"}` : "Finality is checked separately from a returned transaction hash."}</span>
    </div>
  );
}

export default function Home() {
  const wallet = useWallet();
  const configured = isMetalArenaConfigured();
  const [metal, setMetal] = useState<Metal>("GOLD");
  const [clock, setClock] = useState(0);
  const [market, setMarket] = useState<MarketRecord | null>(null);
  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [protocol, setProtocol] = useState<ProtocolConfig | null>(null);
  const [positions, setPositions] = useState<Partial<Record<Side, PositionRecord | null>>>({});
  const [quotes, setQuotes] = useState<Partial<Record<Side, QuoteRecord | null>>>({});
  const [previewPools, setPreviewPools] = useState<PreviewPools>({ UP: 0, DOWN: 0 });
  const [previewBalance, setPreviewBalance] = useState(0);
  const [stakeAmount, setStakeAmount] = useState("25");
  const [selectedSide, setSelectedSide] = useState<Side>("UP");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(configured);
  const [message, setMessage] = useState<UiMessage>(null);
  const [tx, setTx] = useState<TxSnapshot | null>(null);

  useEffect(() => {
    setClock(Math.floor(Date.now() / 1000));
    const timer = window.setInterval(() => setClock(Math.floor(Date.now() / 1000)), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const client = new MetalArenaClient(wallet.address || undefined);
      const [nextMarket, nextProtocol, nextAccount] = await Promise.all([
        client.getMarket(metal),
        client.getProtocolConfig(),
        wallet.address ? client.getAccount(wallet.address) : Promise.resolve(null),
      ]);
      setMarket(nextMarket);
      setProtocol(nextProtocol);
      setAccount(nextAccount);
      if (nextMarket && wallet.address) {
        const [up, down] = await Promise.all([
          client.getPosition(nextMarket.market_id, wallet.address, "UP"),
          client.getPosition(nextMarket.market_id, wallet.address, "DOWN"),
        ]);
        setPositions({ UP: up.exists ? up : null, DOWN: down.exists ? down : null });
        if (up.exists || down.exists) {
          const [upQuote, downQuote] = await Promise.all([
            client.getQuote(nextMarket.market_id, wallet.address, "UP"),
            client.getQuote(nextMarket.market_id, wallet.address, "DOWN"),
          ]);
          setQuotes({ UP: upQuote.exists ? upQuote : null, DOWN: downQuote.exists ? downQuote : null });
        }
      } else {
        setPositions({});
        setQuotes({});
      }
      setMessage(null);
    } catch (error) {
      setMessage({ tone: "warning", text: error instanceof Error ? error.message : "Contract reads are temporarily unavailable." });
    } finally {
      setLoading(false);
    }
  }, [configured, metal, wallet.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visibleMarket = market && !configured
    ? { ...market, up_pool: previewPools.UP, down_pool: previewPools.DOWN, total_staked: previewPools.UP + previewPools.DOWN }
    : market;
  const effectiveMarket = visibleMarket || previewMarket(metal, clock, previewPools);

  const runContractAction = useCallback(async (label: string, action: (client: MetalArenaClient) => Promise<string>) => {
    if (!wallet.address) {
      setMessage({ tone: "warning", text: "Connect a wallet before sending a contract transaction." });
      return;
    }
    if (!wallet.onGenLayer) {
      setMessage({ tone: "warning", text: "Switch MetaMask to the configured GenLayer test network before sending." });
      return;
    }
    setBusy(true);
    setMessage({ tone: "info", text: `${label} submitted. Waiting for protocol finality…` });
    try {
      const client = new MetalArenaClient(wallet.address);
      const hash = await action(client);
      setTx({ hash, status: "SUBMITTED", execution: "UNKNOWN", success: false });
      const receipt = await client.waitForFinality(hash);
      setTx(receipt);
      if (!receipt.success) throw new Error(receipt.error || `The ${label.toLowerCase()} receipt finalized without successful contract execution.`);
      setMessage({ tone: "success", text: `${label} finalized. State read-back is refreshing.` });
      toast.success(`${label} finalized`);
      await refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : `${label} failed.`;
      setMessage({ tone: "error", text });
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }, [refresh, wallet.address, wallet.onGenLayer]);

  const onConnect = useCallback(() => {
    void wallet.connect().catch((error) => {
      const text = error instanceof Error ? error.message : "Wallet connection failed.";
      setMessage({ tone: "error", text });
      toast.error(text);
    });
  }, [wallet]);

  const onClaimCredits = useCallback(() => {
    if (!configured) {
      setPreviewBalance(1_000);
      setMessage({ tone: "warning", text: "Preview allocation added in memory only. No credits or transaction exist on-chain." });
      return;
    }
    void runContractAction("Demo-credit request", (client) => client.claimDemoCredits());
  }, [configured, runContractAction]);

  const onOpenMarket = useCallback(() => {
    if (!configured) {
      setMarket(previewMarket(metal, clock, previewPools));
      setMessage({ tone: "warning", text: "Preview market opened in memory. It has no authoritative ledger or settlement transaction." });
      return;
    }
    void runContractAction("Market open", (client) => client.openNextMarket(metal));
  }, [clock, configured, metal, previewPools, runContractAction]);

  const onStake = useCallback(() => {
    const amount = safeAmount(stakeAmount);
    if (amount <= 0n) {
      setMessage({ tone: "warning", text: "Enter a whole-number demo-credit amount greater than zero." });
      return;
    }
    if (!configured) {
      if (Number(amount) > previewBalance) {
        setMessage({ tone: "warning", text: "The preview allocation is too small. Add the 1,000-credit preview allocation first." });
        return;
      }
      setPreviewBalance((value) => value - Number(amount));
      setPreviewPools((value) => ({ ...value, [selectedSide]: value[selectedSide] + Number(amount) }));
      setMessage({ tone: "warning", text: `Preview stake drafted on ${selectedSide}. No contract transaction was submitted.` });
      return;
    }
    if (!market) {
      setMessage({ tone: "warning", text: "Open the next market before entering a position." });
      return;
    }
    void runContractAction(`Stake ${selectedSide}`, (client) => client.placeStake(market.market_id, selectedSide, amount));
  }, [configured, market, previewBalance, runContractAction, selectedSide, stakeAmount]);

  const onClaim = useCallback((side: Side) => {
    if (!configured || !market) return;
    void runContractAction(`Claim ${side}`, (client) => client.claim(market.market_id, side));
  }, [configured, market, runContractAction]);

  const status = lifecycleStatus(market, effectiveMarket.status);
  const balance = configured ? Number(integerValue(account?.demo_balance)) : previewBalance;
  const currentSource = market?.evidence_url || effectiveMarket.evidence_url;
  const positionMarket = visibleMarket || effectiveMarket;
  const effectivePositions = configured ? positions : {};
  const effectiveQuotes = configured ? quotes : {};

  return (
    <div className="app-shell">
      <Header metal={metal} setMetal={(next) => { setMetal(next); setMarket(null); setMessage(null); }} onConnect={onConnect} walletAddress={wallet.address} connected={wallet.connected} connecting={wallet.connecting} configured={configured} />
      <main className="main-shell">
        <DemoBanner configured={configured} />
        <div className="heading-row">
          <div>
            <h1 className="page-title">A measured market for a moving metal.</h1>
            <p className="page-description">Take a 15-minute UP or DOWN prediction position on the {METALS[metal].name} benchmark. The frontend observes; validators adjudicate; the contract settles.</p>
          </div>
          <div className="heading-actions">
            <div className="credit-balance"><span>{configured ? "Demo balance" : "Preview allocation"}</span><strong>{balance.toLocaleString("en-US")} credits</strong></div>
            <button type="button" className="secondary-action" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh</button>
          </div>
        </div>
        <div className="workbench">
          <div>
            <MarketPanel metal={metal} market={effectiveMarket} nowSeconds={clock} />
            <section className="panel" style={{ marginTop: 18 }}>
              <div className="panel-heading"><div className="panel-title"><ShieldCheck size={16} /> What is being settled?</div><span className="panel-label">protocol terms</span></div>
              <div className="panel-body">
                <div className="evidence-grid">
                  <div className="detail-line"><span>Question</span><span className="detail-value">End price &gt; start price?</span></div>
                  <div className="detail-line"><span>Instrument</span><span className="detail-value">{METALS[metal].symbol} spot fixture</span></div>
                  <div className="detail-line"><span>Entry</span><span className="detail-value">Upcoming interval only</span></div>
                  <div className="detail-line"><span>Pool model</span><span className="detail-value">Pari-mutuel · no early exit</span></div>
                  <div className="detail-line"><span>Fee</span><span className="detail-value">2% of distributable pool</span></div>
                  <div className="detail-line"><span>Rounding</span><span className="detail-value">Floor each payout</span></div>
                </div>
              </div>
            </section>
          </div>
          <aside className="rail">
            <EntryPanel metal={metal} market={visibleMarket} account={account} selectedSide={selectedSide} setSelectedSide={setSelectedSide} stakeAmount={stakeAmount} setStakeAmount={setStakeAmount} previewBalance={previewBalance} onClaimCredits={onClaimCredits} onOpenMarket={onOpenMarket} onStake={onStake} busy={busy} configured={configured} connected={wallet.connected} message={message} />
            <section className="panel">
              <div className="panel-heading"><div className="panel-title"><Clock3 size={16} /> Time and source</div><span className="panel-label">UTC</span></div>
              <div className="panel-body">
                <div className="detail-line"><span>Current interval</span><span className="detail-value">{timestampLabel(effectiveMarket.start_at, true)} → {timestampLabel(effectiveMarket.end_at)}</span></div>
                <div className="detail-line"><span>Source</span><span className="detail-value"><a href={currentSource} target="_blank" rel="noreferrer">Public fixture <ExternalLink size={11} /></a></span></div>
                <div className="detail-line"><span>Instrument</span><span className="detail-value">{METALS[metal].symbol}</span></div>
                <div className="detail-line"><span>Staleness</span><span className="detail-value amber">Synthetic / historical</span></div>
              </div>
              <Lifecycle status={status} />
            </section>
          </aside>
        </div>
        <div className="lower-grid">
          <HistoryPanel metal={metal} />
          <PositionsPanel metal={metal} market={positionMarket} positions={effectivePositions} quotes={effectiveQuotes} onClaim={onClaim} configured={configured} connected={wallet.connected} busy={busy} />
          <EvidencePanel metal={metal} market={positionMarket} protocol={protocol} />
        </div>
        <AppFooter configured={configured} tx={tx} />
      </main>
    </div>
  );
}
