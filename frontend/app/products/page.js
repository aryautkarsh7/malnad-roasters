"use client";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ErrorState from "@/components/ErrorState";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useCatalog } from "@/lib/catalog";
import { timeAgo } from "@/lib/format";

export default function Products() {
  const { products, loading, refreshing, error, slow, savedAt, refresh } = useCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    if (c) setCategory(c);
  }, []);

  const categories = useMemo(() => ["All", ...new Set((products || []).map((p) => p.category))], [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || []).filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [products, query, category]);

  function clearFilters() {
    setQuery("");
    setCategory("All");
  }

  return (
    <div>
      <div className="page-head">
        <h1>Shop</h1>
        <p>
          {products ? `${visible.length} of ${products.length} products` : "Loading the catalog"}
          {savedAt && !refreshing ? `, updated ${timeAgo(savedAt)}` : ""}
        </p>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="search" className="sr-only" style={{ position: "absolute", left: "-9999px" }}>
            Search products
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by name or tasting note"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={refresh} disabled={refreshing}>
          {refreshing ? "Refreshing" : "Refresh catalog"}
        </button>
      </div>

      <div className="chips" role="group" aria-label="Filter by category" style={{ marginBottom: "1.25rem" }}>
        {categories.map((c) => (
          <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {error && products && (
        <div className="alert alert-warn" role="status" style={{ marginBottom: "1rem" }}>
          Showing the saved catalog because the latest list could not be loaded. {error}
        </div>
      )}

      {loading && !products ? (
        <>
          <ProductGridSkeleton />
          {slow && <p className="muted small" style={{ marginTop: "1rem" }}>The server may be waking up. This can take up to a minute.</p>}
        </>
      ) : error && !products ? (
        <ErrorState title="Could not load products" message={error} onRetry={refresh} />
      ) : visible.length === 0 ? (
        <div className="state">
          <h2>No products match</h2>
          <p>Try a different search term or choose another category.</p>
          <button className="btn" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
