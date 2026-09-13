"use client";

import { createClient } from "genlayer-js";
import { localnet, studionet } from "genlayer-js/chains";

export interface EthereumProvider {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const GENLAYER_CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || 61999);
export const GENLAYER_CHAIN_ID_HEX = `0x${GENLAYER_CHAIN_ID.toString(16)}`;
export const RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

export const GENLAYER_NETWORK = {
  chainId: GENLAYER_CHAIN_ID_HEX,
  chainName: process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || "GenLayer Studio",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [],
};

let selectedProvider: EthereumProvider | null = null;

function fallbackProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const injected = window.ethereum;
  const providers = Array.isArray(injected?.providers) ? injected.providers : [];
  return providers.find((provider) => provider.isMetaMask && !provider.isPhantom)
    || (injected?.isMetaMask && !injected.isPhantom ? injected : null);
}

export async function discoverMetaMask(): Promise<EthereumProvider | null> {
  if (selectedProvider) return selectedProvider;
  const fallback = fallbackProvider();
  if (fallback) selectedProvider = fallback;
  return selectedProvider;
}

export function getEthereumProvider(): EthereumProvider | null {
  return selectedProvider || fallbackProvider();
}

export async function getAccounts(): Promise<string[]> {
  const provider = await discoverMetaMask();
  if (!provider) return [];
  const accounts = await provider.request({ method: "eth_accounts" });
  return Array.isArray(accounts) ? accounts.map(String) : [];
}

export async function connectMetaMask(): Promise<string> {
  const provider = await discoverMetaMask();
  if (!provider) throw new Error("MetaMask is not installed.");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const list = Array.isArray(accounts) ? accounts.map(String) : [];
  if (!list[0]) throw new Error("No wallet account was selected.");
  const chainId = await provider.request({ method: "eth_chainId" });
  if (String(chainId).toLowerCase() !== GENLAYER_CHAIN_ID_HEX.toLowerCase()) {
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GENLAYER_CHAIN_ID_HEX }] });
    } catch (error: any) {
      if (error?.code === 4902) {
        await provider.request({ method: "wallet_addEthereumChain", params: [GENLAYER_NETWORK] });
      } else if (error?.code === 4001) {
        throw new Error("Network switch was cancelled.");
      } else {
        throw error;
      }
    }
  }
  return list[0];
}

export function chainForEndpoint(endpoint: string) {
  return /127\.0\.0\.1|localhost/i.test(endpoint) ? localnet : studionet;
}

export function createGenLayerClient(account?: string) {
  const provider = getEthereumProvider();
  return createClient({
    chain: chainForEndpoint(RPC_URL) as any,
    endpoint: RPC_URL,
    ...(account ? { account: account as `0x${string}` } : {}),
    ...(provider ? { provider: provider as never } : {}),
  } as any);
}

export function formatAddress(address: string | null | undefined, size = 13) {
  if (!address) return "Not connected";
  if (address.length <= size) return address;
  const left = Math.ceil((size - 3) / 2);
  return `${address.slice(0, left)}…${address.slice(-Math.floor((size - 3) / 2))}`;
}
