"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "./Loader";
import { useAuth } from "@/lib/auth";

export default function RequireAuth({ admin = false, children }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <Loader page message="Checking your session" />;

  if (admin && !isAdmin) {
    return (
      <div className="state">
        <h2>Admin access only</h2>
        <p>This area is limited to store administrators. Your account does not have access.</p>
        <Link href="/" className="btn">Back to the store</Link>
      </div>
    );
  }
  return children;
}
