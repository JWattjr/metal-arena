"use client";

import {
  ExecutionResult,
  TransactionStatus,
  executionResultNumberToName,
  transactionsStatusNumberToName,
  type GenLayerTransaction,
} from "genlayer-js/types";
import type { CalldataEncodable } from "genlayer-js/types";

import {
  chainForEndpoint,
  createGenLayerClient,
  GENLAYER_CHAIN_ID_HEX,
  getEthereumProvider,
  RPC_URL,
} from "@/lib/genlayer/client";
import type { AccountRecord, MarketRecord, Metal, PositionRecord, ProtocolConfig, QuoteRecord, Side, TxSnapshot } from "./types";

const ARENA_ADDRESS = (process.env.NEXT_PUBLIC_METAL_ARENA_ADDRESS || "").trim();
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function plain(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Map) return Object.fromEntries([...value.entries()].map(([key, nested]) => [String(key), plain(nested)]));
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, plain(nested)]));
  return value;
}

function record<T>(value: unknown): T {
  const normalized = plain(value);
  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) {
    throw new Error("The contract returned an unexpected response shape.");
  }
  return normalized as T;
}

function address(value: string) {
  if (!ADDRESS.test(value)) throw new Error("MetalArena is not configured with a valid contract address.");
  return value as `0x${string}`;
}

function statusName(receipt: GenLayerTransaction) {
  const raw = receipt as any;
  const direct = raw.statusName || raw.status_name;
  if (typeof direct === "string") return direct.toUpperCase();
  const numeric = raw.status;
  if (typeof numeric === "number" || typeof numeric === "string") {
    return String((transactionsStatusNumberToName as Record<string, string>)[String(numeric)] || numeric).toUpperCase();
  }
  return "UNKNOWN";
}

function executionName(receipt: GenLayerTransaction) {
  const raw = receipt as any;
  const direct = raw.txExecutionResultName || raw.tx_execution_result_name;
  if (typeof direct === "string") return direct.toUpperCase();
  const numeric = raw.txExecutionResult ?? raw.tx_execution_result;
  if (typeof numeric === "number" || typeof numeric === "string") {
    return String((executionResultNumberToName as Record<string, string>)[String(numeric)] || numeric).toUpperCase();
  }
  const leader = raw.consensus_data?.leader_receipt?.[0];
  if (typeof leader?.execution_result === "number" || typeof leader?.execution_result === "string") {
    return String((executionResultNumberToName as Record<string, string>)[String(leader.execution_result)] || leader.execution_result).toUpperCase();
  }
  return "UNKNOWN";
}

function transactionError(receipt: GenLayerTransaction) {
  const raw = receipt as any;
  return String(raw.error || raw.txExecutionError || raw.tx_execution_error || raw.message || "");
}

function succeeded(execution: string) {
  return execution === ExecutionResult.FINISHED_WITH_RETURN || execution === "SUCCESS";
}

export function isMetalArenaConfigured() {
  return ADDRESS.test(ARENA_ADDRESS) && Boolean(RPC_URL);
}

export function deploymentConfiguration() {
  return {
    arenaAddress: ARENA_ADDRESS,
    rpcUrl: RPC_URL,
    network: chainForEndpoint(RPC_URL).name,
    configured: isMetalArenaConfigured(),
  };
}

export class MetalArenaClient {
  private readonly client: any;
  private readonly arena: `0x${string}`;
  private readTail: Promise<unknown> = Promise.resolve();

  constructor(account?: string) {
    this.arena = address(ARENA_ADDRESS);
    this.client = createGenLayerClient(account);
  }

  private read(functionName: string, args: CalldataEncodable[] = []) {
    const request = this.readTail.then(() => this.client.readContract({ address: this.arena, functionName, args }));
    this.readTail = request.catch(() => undefined);
    return request;
  }

  private async write(functionName: string, args: CalldataEncodable[] = []) {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("Connect MetaMask before sending a transaction.");
    const chainId = await provider.request({ method: "eth_chainId" });
    if (String(chainId).toLowerCase() !== GENLAYER_CHAIN_ID_HEX.toLowerCase()) {
      throw new Error(`Switch MetaMask to ${process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || "GenLayer Studio"}.`);
    }
    return String(await this.client.writeContract({ address: this.arena, functionName, args, value: 0n }));
  }

  async getProtocolConfig() {
    return record<ProtocolConfig>(await this.read("get_protocol_config"));
  }

  async getMarket(metal: Metal) {
    const result = record<MarketRecord>(await this.read("get_market_for_metal", [metal]));
    return result.exists ? result : null;
  }

  async getAccount(account: string) {
    return record<AccountRecord>(await this.read("get_account", [account as `0x${string}`]));
  }

  async getPosition(marketId: string, account: string, side: Side) {
    return record<PositionRecord>(await this.read("get_position", [marketId, account as `0x${string}`, side]));
  }

  async getQuote(marketId: string, account: string, side: Side) {
    return record<QuoteRecord>(await this.read("get_claim_quote", [marketId, account as `0x${string}`, side]));
  }

  async claimDemoCredits() {
    return this.write("claim_demo_credits");
  }

  async openNextMarket(metal: Metal) {
    return this.write("open_next_market", [metal]);
  }

  async placeStake(marketId: string, side: Side, amount: bigint) {
    return this.write("place_stake", [marketId, side, amount]);
  }

  async requestSettlement(marketId: string) {
    return this.write("request_settlement", [marketId]);
  }

  async requestRefund(marketId: string) {
    return this.write("refund_after_deadline", [marketId]);
  }

  async claim(marketId: string, side: Side) {
    return this.write("claim", [marketId, side]);
  }

  async waitForFinality(hash: string): Promise<TxSnapshot> {
    const receipt = await this.client.waitForTransactionReceipt({
      hash: hash as `0x${string}`,
      status: TransactionStatus.FINALIZED,
      interval: 4_000,
      retries: 75,
    });
    const status = statusName(receipt);
    const execution = executionName(receipt);
    const error = transactionError(receipt);
    return {
      hash,
      status,
      execution,
      success: succeeded(execution),
      ...(error ? { error } : {}),
    };
  }
}
