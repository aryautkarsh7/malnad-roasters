export const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const dateTime = (s) =>
  new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function stockState(stock) {
  if (stock <= 0) return { key: "out", label: "Out of stock" };
  if (stock <= 5) return { key: "low", label: `Only ${stock} left` };
  return { key: "in", label: "In stock" };
}

export const STATUS_LABELS = {
  new: "New",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const shortId = (id) => id.slice(0, 8).toUpperCase();

export function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} h ago` : `${Math.round(hrs / 24)} d ago`;
}
