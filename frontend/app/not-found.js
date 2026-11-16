import Link from "next/link";

export default function NotFound() {
  return (
    <div className="state">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist or has moved.</p>
      <Link href="/products" className="btn">Browse coffee</Link>
    </div>
  );
}
