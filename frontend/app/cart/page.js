"use client";
import Link from "next/link";
import { useEffect } from "react";
import ProductImage from "@/components/ProductImage";
import QuantityControl from "@/components/QuantityControl";
import Loader from "@/components/Loader";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog";
import { inr } from "@/lib/format";

export default function Cart() {
  const { items, hydrated, total, count, setQty, remove, reconcile } = useCart();
  const { products, error } = useCatalog();

  useEffect(() => {
    if (products) reconcile(products);
  }, [products, reconcile]);

  if (!hydrated) return <Loader page message="Loading your cart" />;

  if (items.length === 0) {
    return (
      <div className="state">
        <h2>Your cart is empty</h2>
        <p>Add a bag of coffee to get started.</p>
        <Link href="/products" className="btn">Browse coffee</Link>
      </div>
    );
  }

  const blocked = items.some((i) => i.stock <= 0);

  return (
    <div>
      <div className="page-head">
        <h1>Your cart</h1>
        <p>{count} {count === 1 ? "item" : "items"}</p>
      </div>
      {error && <div className="alert alert-warn" style={{ marginBottom: "1rem" }}>Prices and stock could not be refreshed. They will be checked again at checkout.</div>}
      {blocked && <div className="alert alert-error" role="alert" style={{ marginBottom: "1rem" }}>Some items are out of stock. Remove them to continue.</div>}

      <div className="cart-layout">
        <div className="panel">
          {items.map((item) => (
            <div className="line" key={item.id}>
              <div className="thumb-box">
                <ProductImage src={item.image_url} alt={item.name} />
              </div>
              <div className="line-body">
                <Link href={`/products/${item.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>{item.name}</Link>
                {item.stock <= 0 ? (
                  <p className="stock stock-out">Out of stock</p>
                ) : (
                  <p className="small muted">{inr(item.price)} each</p>
                )}
                <div className="line-actions">
                  {item.stock > 0 ? (
                    <QuantityControl value={item.quantity} max={item.stock} onChange={(n) => setQty(item.id, n)} label={`Quantity of ${item.name}`} />
                  ) : <span />}
                  <span className="price">{inr(item.price * item.quantity)}</span>
                  <button className="link-danger" onClick={() => remove(item.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="panel summary">
          <h2 style={{ fontSize: "1.3rem", marginBottom: "0.75rem" }}>Order total</h2>
          <div className="totals">
            <div><span>Subtotal</span><span>{inr(total)}</span></div>
            <div><span>Delivery</span><span>Free</span></div>
            <div className="grand"><span>Total</span><span>{inr(total)}</span></div>
          </div>
          <Link
            href="/checkout"
            className="btn btn-block"
            aria-disabled={blocked}
            onClick={(e) => blocked && e.preventDefault()}
            style={{ marginTop: "1rem" }}
          >
            Go to checkout
          </Link>
          <Link href="/products" className="btn btn-secondary btn-block" style={{ marginTop: "0.5rem" }}>Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
