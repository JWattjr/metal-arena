"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { WalletProvider } from "@/lib/genlayer/WalletProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      {children}
      <Toaster position="bottom-right" theme="dark" toastOptions={{ className: "toast" }} />
    </WalletProvider>
  );
}
