"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import Loader from "@/components/Loader";
import ProductForm from "@/components/ProductForm";
import ProductImage from "@/components/ProductImage";
import { api } from "@/lib/api";
import { clearCatalogCache } from "@/lib/catalog";
import { inr, stockState } from "@/lib/format";
import { useToast } from "@/lib/toast";

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      setProducts(await api("/products"));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => [...new Set((products || []).map((p) => p.category))], [products]);

  async function save(values) {
    setBusy(true);
    setFormError("");
    try {
      if (editing === "new") {
        await api("/admin/products", { method: "POST", auth: true, body: values });
        toast("Product added.", "success");
      } else {
        await api(`/admin/products/${editing.id}`, { method: "PUT", auth: true, body: values });
        toast("Product updated.", "success");
      }
      await clearCatalogCache();
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? Past orders keep their line items.`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: "DELETE", auth: true });
      toast("Product deleted.", "success");
      await clearCatalogCache();
      await load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  if (error) return <ErrorState title="Could not load products" message={error} onRetry={load} />;
  if (!products) return <Loader message="Loading products" />;

  return (
    <div>
      <div className="row row-between" style={{ marginBottom: "1rem" }}>
        <h2>{products.length} products</h2>
        {!editing && <button className="btn" onClick={() => { setFormError(""); setEditing("new"); }}>Add product</button>}
      </div>

      {editing && (
        <ProductForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          categories={categories}
          busy={busy}
          serverError={formError}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {products.length === 0 ? (
        <div className="state"><h2>No products yet</h2><p>Add your first product to start selling.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const s = stockState(p.stock);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-product">
                        <div className="thumb-box"><ProductImage src={p.image_url} alt="" /></div>
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>{inr(p.price)}</td>
                    <td><span className={`stock stock-${s.key}`}>{p.stock} {s.key === "out" ? "(sold out)" : ""}</span></td>
                    <td>
                      <div className="row" style={{ flexWrap: "nowrap" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setFormError(""); setEditing(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
