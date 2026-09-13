/**
 * Deploy MetalArena's finality gate and arena, then bind them exactly once.
 *
 * Run with the official GenLayer CLI after selecting a configured test network:
 *   genlayer network set studionet
 *   npm run deploy
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  TransactionStatus,
  executionResultNumberToName,
  transactionsStatusNumberToName,
} from "genlayer-js/types";
import type {
  CalldataEncodable,
  DecodedDeployData,
  GenLayerChain,
  GenLayerClient,
  GenLayerTransaction,
  TransactionHash,
} from "genlayer-js/types";

const GATE_SOURCE = "contracts/settlement_gate.py";
const ARENA_SOURCE = "contracts/metal_arena.py";
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

type Loose = Record<string, any>;

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === "" ? fallback : value.trim();
}

function validAddress(value: string, label: string): string {
  if (!ADDRESS_PATTERN.test(value)) throw new Error(`${label} is not a valid address: ${value}`);
  return value.toLowerCase();
}

function receiptStatus(receipt: GenLayerTransaction): string {
  const raw = receipt as unknown as Loose;
  if (typeof raw.statusName === "string") return raw.statusName.toUpperCase();
  if (typeof raw.status_name === "string") return raw.status_name.toUpperCase();
  const numeric = raw.status;
  if (typeof numeric === "number" || typeof numeric === "string") {
    return String((transactionsStatusNumberToName as Record<string, string>)[String(numeric)] ?? numeric).toUpperCase();
  }
  return "UNKNOWN";
}

function executionStatus(receipt: GenLayerTransaction): string {
  const raw = receipt as unknown as Loose;
  const direct = raw.txExecutionResultName ?? raw.tx_execution_result_name;
  if (typeof direct === "string") return direct.toUpperCase();
  const numeric = raw.txExecutionResult ?? raw.tx_execution_result;
  if (typeof numeric === "number" || typeof numeric === "string") {
    return String((executionResultNumberToName as Record<string, string>)[String(numeric)] ?? numeric).toUpperCase();
  }
  const leader = raw.consensus_data?.leader_receipt?.[0];
  if (typeof leader?.execution_result === "string") return leader.execution_result.toUpperCase();
  return "UNKNOWN";
}

function assertSucceeded(label: string, receipt: GenLayerTransaction): GenLayerTransaction {
  const consensus = receiptStatus(receipt);
  const execution = executionStatus(receipt);
  if (!["ACCEPTED", "FINALIZED"].includes(consensus) || !["SUCCESS", "FINISHED_WITH_RETURN"].includes(execution)) {
    throw new Error(`${label} failed: consensus=${consensus}, execution=${execution}. Receipt=${JSON.stringify(receipt)}`);
  }
  return receipt;
}

class Deployer {
  private readonly retries = Number(env("METAL_ARENA_WAIT_RETRIES", "200"));
  private readonly completed: Array<{ label: string; hash: string }> = [];

  constructor(private readonly client: GenLayerClient<GenLayerChain>) {}

  private async wait(hash: TransactionHash) {
    return this.client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      interval: 5_000,
      retries: this.retries,
    });
  }

  async deploy(label: string, source: string): Promise<`0x${string}`> {
    console.log(`\n▸ ${label}: deploying ${source}`);
    const code = new Uint8Array(readFileSync(path.resolve(process.cwd(), source)));
    const hash = (await this.client.deployContract({ code, args: [] })) as TransactionHash;
    const receipt = assertSucceeded(label, await this.wait(hash));
    const data = receipt.data as Loose | undefined;
    const decoded = receipt.txDataDecoded as DecodedDeployData | undefined;
    const deployed = data?.contract_address ?? decoded?.contractAddress;
    if (typeof deployed !== "string" || !ADDRESS_PATTERN.test(deployed)) {
      throw new Error(`${label} did not return a contract address.`);
    }
    console.log(`  ✓ ${deployed} (${hash})`);
    this.completed.push({ label, hash: String(hash) });
    return deployed as `0x${string}`;
  }

  async write(label: string, contract: `0x${string}`, functionName: string, args: CalldataEncodable[]) {
    console.log(`▸ ${label}`);
    const hash = (await this.client.writeContract({ address: contract, functionName, args, value: 0n })) as TransactionHash;
    assertSucceeded(label, await this.wait(hash));
    console.log(`  ✓ ${hash}`);
    this.completed.push({ label, hash: String(hash) });
    return hash;
  }

  completedTransactions() {
    return this.completed;
  }
}

export default async function main(client: GenLayerClient<GenLayerChain>) {
  const deployer = new Deployer(client);
  const gateAddress = await deployer.deploy("1/4 SettlementFinalityGate", GATE_SOURCE);
  const arenaAddress = await deployer.deploy("2/4 MetalArena", ARENA_SOURCE);

  await deployer.write("3/4 Bind gate → arena", gateAddress, "configure_arena", [validAddress(arenaAddress, "MetalArena address")]);
  await deployer.write("4/4 Bind arena → gate", arenaAddress, "configure_finality_gate", [validAddress(gateAddress, "Settlement gate address")]);

  const network = (client.chain as GenLayerChain | undefined)?.name ?? "unknown-network";
  const record = {
    network,
    deployedAt: new Date().toISOString(),
    settlementGateAddress: gateAddress,
    metalArenaAddress: arenaAddress,
    sourcePolicy: "metal-arena-synthetic-fixture-v1",
    deploymentTransactions: deployer.completedTransactions(),
  };
  const outputPath = path.resolve(process.cwd(), "deploy/last-deployment.json");
  writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");
  console.log(`\nMetalArena deployed on ${network}. Addresses recorded at ${outputPath}`);
  console.log(`  NEXT_PUBLIC_METAL_ARENA_ADDRESS=${arenaAddress}`);
  console.log(`  NEXT_PUBLIC_SETTLEMENT_GATE_ADDRESS=${gateAddress}`);
}
