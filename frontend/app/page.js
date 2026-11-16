"use client";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ErrorState from "@/components/ErrorState";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useCatalog } from "@/lib/catalog";

export default function Home() {
  const { products, loading, error, refresh } = useCatalog();
  const featured = (products || []).filter((p) => p.stock > 0).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Coffee from the Western Ghats, roasted to order.</h1>
          <p>
            We buy from estates in Chikmagalur, Coorg and Sakleshpur, roast in batches of 12 kg and
            pack the same day.
          </p>
          <div className="row">
            <Link href="/products" className="btn">Shop coffee</Link>
            <Link href="/products?category=Brewing%20kit" className="btn btn-secondary">Brewing kits</Link>
          </div>
        </div>
        <div className="hero-shelf" aria-hidden="true">
          <img src="/products/coorg.svg" alt="" />
          <img src="/products/chikmagalur.svg" alt="" />
          <img src="/products/morning-blend.svg" alt="" />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Ready to ship</h2>
          <Link href="/products">See all products</Link>
        </div>
        {loading && !products ? (
          <ProductGridSkeleton count={4} />
        ) : error && !products ? (
          <ErrorState title="Could not load products" message={error} onRetry={refresh} />
        ) : (
          <div className="grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="section facts">
        <div>
          <h3>Roasted twice a week</h3>
          <p>Batches go into the drum on Tuesday and Friday, so bags leave the roastery within a few days of roasting.</p>
        </div>
        <div>
          <h3>Named farms</h3>
          <p>Every single origin bag lists the estate, altitude and process used for that lot.</p>
        </div>
        <div>
          <h3>Resealable packs</h3>
          <p>Foil bags with a one-way valve and a zip, packed in 250 g and 500 g sizes.</p>
        </div>
      </section>
    </>
  );
}
