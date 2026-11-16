"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductImage from "@/components/ProductImage";
import QuantityControl from "@/components/QuantityControl";
import ErrorState from "@/components/ErrorState";
import Loader from "@/components/Loader";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { inr, stockState } from "@/lib/format";

export default function ProductDetail() {
  const { id } = useParams();
  const { products, loading, error, refresh } = useCatalog();
  const { add, items } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);

  const product = products?.find((p) => p.id === id);

  useEffect(() => {
    if (product && qty > product.stock && product.stock > 0) setQty(product.stock);
  }, [product, qty]);

  if (loading && !products) return <Loader page message="Loading product" />;
  if (error && !products) return <ErrorState title="Could not load this product" message={error} onRetry={refresh} />;
  if (!product) {
    return (
      <div className="state">
        <h2>Product not found</h2>
        <p>It may have been removed from the store.</p>
        <Link href="/products" className="btn">Back to the shop</Link>
      </div>
    );
  }

  const state = stockState(product.stock);
  const inCart = items.find((i) => i.id === product.id)?.quantity || 0;

  function addToCart() {
    const res = add(product, qty);
    toast(res.message || `${qty} x ${product.name} added to cart.`, res.ok ? "success" : "error");
  }

  return (
    <div className="detail">
      <div className="detail-media">
        <ProductImage src={product.image_url} alt={product.name} eager />
      </div>
      <div className="detail-info">
        <p className="muted">{product.category}</p>
        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>{product.name}</h1>
        <p className="detail-price">{inr(product.price)}</p>
        <p className={`stock stock-${state.key}`} style={{ fontSize: "0.95rem" }}>{state.label}</p>
        <p>{product.description}</p>

        {state.key === "out" ? (
          <div className="alert alert-warn">This product is sold out. Check back after the next roast.</div>
        ) : (
          <div className="row">
            <QuantityControl value={qty} max={product.stock} onChange={(n) => setQty(Math.max(1, n))} label="Quantity to add" />
            <button className="btn" onClick={addToCart}>Add to cart</button>
          </div>
        )}
        {inCart > 0 && (
          <p className="small muted">
            {inCart} in your cart. <Link href="/cart">View cart</Link>
          </p>
        )}
      </div>
    </div>
  );
}
