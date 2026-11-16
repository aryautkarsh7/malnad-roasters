"use client";
import { ToastProvider } from "@/lib/toast";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
