"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  connectMetaMask,
  discoverMetaMask,
  formatAddress,
  GENLAYER_CHAIN_ID_HEX,
  getAccounts,
  getEthereumProvider,
} from "./client";

type WalletContextValue = {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  onGenLayer: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const DISCONNECT_KEY = "metal-arena.wallet.disconnected";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [onGenLayer, setOnGenLayer] = useState(false);

  const refresh = useCallback(async () => {
    const provider = await discoverMetaMask();
    if (!provider || window.localStorage.getItem(DISCONNECT_KEY) === "true") {
      setConnecting(false);
      return;
    }
    const accounts = await getAccounts();
    const chain = await provider.request({ method: "eth_chainId" });
    setAddress(accounts[0] || null);
    setOnGenLayer(String(chain).toLowerCase() === GENLAYER_CHAIN_ID_HEX.toLowerCase());
    setConnecting(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;
    const onAccounts = (accounts: string[]) => setAddress(accounts?.[0] || null);
    const onChain = (chain: string) => setOnGenLayer(String(chain).toLowerCase() === GENLAYER_CHAIN_ID_HEX.toLowerCase());
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener("accountsChanged", onAccounts);
      provider.removeListener("chainChanged", onChain);
    };
  }, [connecting]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const next = await connectMetaMask();
      window.localStorage.removeItem(DISCONNECT_KEY);
      setAddress(next);
      setOnGenLayer(true);
      return next;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    window.localStorage.setItem(DISCONNECT_KEY, "true");
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, connected: Boolean(address), connecting, onGenLayer, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}

export { formatAddress };
