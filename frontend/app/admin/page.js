"use client";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import Loader from "@/components/Loader";
import { api } from "@/lib/api";
import { STATUS_LABELS, inr } from "@/lib/format";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStats(await api("/admin/stats", { auth: true }));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState title="Could not load the dashboard" message={error} onRetry={load} />;
  if (!stats) return <Loader message="Loading dashboard" />;

  return (
    <div className="stack-lg">
      <div className="stats">
        <div className="stat"><span className="muted small">Products</span><strong>{stats.products}</strong></div>
        <div className="stat"><span className="muted small">Orders</span><strong>{stats.orders}</strong></div>
        <div className="stat"><span className="muted small">Simulated revenue</span><strong>{inr(stats.revenue)}</strong></div>
        <div className="stat"><span className="muted small">Low or no stock</span><strong>{stats.low_stock + stats.out_of_stock}</strong></div>
      </div>
      <div>
        <h2 style={{ marginBottom: "0.75rem" }}>Orders by status</h2>
        <div className="table-wrap">
          <table style={{ minWidth: 0 }}>
            <tbody>
              {Object.entries(stats.by_status).map(([k, n]) => (
                <tr key={k}>
                  <td><span className={`badge badge-${k}`}>{STATUS_LABELS[k]}</span></td>
                  <td className="right">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: "0.75rem" }}>
          Revenue counts every order that is not cancelled. {stats.out_of_stock} products are out of stock and {stats.low_stock} have 5 or fewer units left.
        </p>
      </div>
    </div>
  );
}
