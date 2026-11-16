"use client";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import { ListSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { STATUS_LABELS, dateTime, inr, shortId } from "@/lib/format";
import { useToast } from "@/lib/toast";

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOrders(await api("/admin/orders", { auth: true }));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order, status) {
    setSaving(order.id);
    try {
      await api(`/admin/orders/${order.id}/status`, { method: "PATCH", auth: true, body: { status } });
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
      toast(`Order ${shortId(order.id)} marked ${STATUS_LABELS[status].toLowerCase()}.`, "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(null);
    }
  }

  if (error) return <ErrorState title="Could not load orders" message={error} onRetry={load} />;
  if (!orders) return <ListSkeleton />;

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="row row-between" style={{ marginBottom: "1rem" }}>
        <h2>{shown.length} orders</h2>
        <div className="field" style={{ minWidth: 180 }}>
          <label htmlFor="filter" style={{ position: "absolute", left: "-9999px" }}>Filter by status</label>
          <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="state"><h2>No orders found</h2><p>Orders placed by customers will appear here.</p></div>
      ) : (
        shown.map((o) => (
          <article className="order" key={o.id}>
            <div className="row row-between">
              <div>
                <strong>Order {shortId(o.id)}</strong>
                <p className="small muted">{dateTime(o.created_at)}, {o.profiles?.email || "deleted user"}</p>
              </div>
              <div className="field">
                <label htmlFor={`status-${o.id}`} style={{ position: "absolute", left: "-9999px" }}>Status for order {shortId(o.id)}</label>
                <select id={`status-${o.id}`} value={o.status} disabled={saving === o.id} onChange={(e) => changeStatus(o, e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
            </div>
            <ul className="order-items">
              {o.order_items.map((i) => (
                <li key={i.id}><span>{i.quantity} x {i.name}</span><span>{inr(i.unit_price * i.quantity)}</span></li>
              ))}
            </ul>
            <div className="row row-between">
              <span className="small muted">
                {o.shipping.full_name}, {o.shipping.phone}, {o.shipping.address}, {o.shipping.city} {o.shipping.pincode}
              </span>
              <strong>{inr(o.total)}</strong>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
