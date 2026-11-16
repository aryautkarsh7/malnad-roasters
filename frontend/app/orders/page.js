"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import ErrorState from "@/components/ErrorState";
import { ListSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { STATUS_LABELS, dateTime, inr, shortId } from "@/lib/format";

function OrderList() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [placed, setPlaced] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOrders(await api("/orders/mine", { auth: true }));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setPlaced(new URLSearchParams(window.location.search).get("placed"));
    load();
  }, [load]);

  return (
    <div className="medium">
      <div className="page-head"><h1>My orders</h1></div>

      {placed && (
        <div className="alert alert-ok" role="status" style={{ marginBottom: "1rem" }}>
          Payment received. Your order {shortId(placed)} has been placed.
        </div>
      )}

      {error ? (
        <ErrorState title="Could not load your orders" message={error} onRetry={load} />
      ) : !orders ? (
        <ListSkeleton />
      ) : orders.length === 0 ? (
        <div className="state">
          <h2>No orders yet</h2>
          <p>Orders you place will show up here with their delivery status.</p>
          <Link href="/products" className="btn">Browse coffee</Link>
        </div>
      ) : (
        orders.map((o) => (
          <article className="order" key={o.id}>
            <div className="row row-between">
              <strong>Order {shortId(o.id)}</strong>
              <span className={`badge badge-${o.status}`}>{STATUS_LABELS[o.status]}</span>
            </div>
            <p className="small muted">{dateTime(o.created_at)}</p>
            <ul className="order-items">
              {o.order_items.map((i) => (
                <li key={i.id}><span>{i.quantity} x {i.name}</span><span>{inr(i.unit_price * i.quantity)}</span></li>
              ))}
            </ul>
            <div className="row row-between">
              <span className="small muted">Delivering to {o.shipping.city}</span>
              <strong>{inr(o.total)}</strong>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

export default function Orders() {
  return (
    <RequireAuth>
      <OrderList />
    </RequireAuth>
  );
}
