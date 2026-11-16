"use client";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { inr, stockState } from "@/lib/format";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const toast = useToast();
  const state = stockState(product.stock);

  function quickAdd() {
    const res = add(product, 1);
    toast(res.message || `${product.name} added to cart.`, res.ok ? "success" : "error");
  }

  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-media" aria-label={product.name}>
        <ProductImage src={product.image_url} alt="" />
        {state.key === "out" && <span className="tag">Sold out</span>}
      </Link>
      <div className="product-body">
        <p className="muted small">{product.category}</p>
        <h3>
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-foot">
          <span className="price">{inr(product.price)}</span>
          <span className={`stock stock-${state.key}`}>{state.label}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={quickAdd} disabled={state.key === "out"}>
          {state.key === "out" ? "Unavailable" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
