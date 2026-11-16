"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setOpen(false), [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const current = (href) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Malnad Roasters home">
          <Logo />
        </Link>
        <nav id="site-nav" className={`nav${open ? " open" : ""}`} aria-label="Main">
          <Link href="/products" aria-current={current("/products")}>Shop</Link>
          {user && <Link href="/orders" aria-current={current("/orders")}>My orders</Link>}
          {isAdmin && <Link href="/admin" aria-current={current("/admin")}>Admin</Link>}
          {user ? (
            <button className="link-btn" onClick={handleSignOut}>Sign out</button>
          ) : (
            <Link href="/login" aria-current={current("/login")}>Sign in</Link>
          )}
        </nav>
        <Link href="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
          Cart <span className="count">{count}</span>
        </Link>
        <button className="menu-btn" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </header>
  );
}
