"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Field from "./Field";
import { useAuth } from "@/lib/auth";
import { isEmail } from "@/lib/validate";
import { isDemoMode } from "@/lib/supabase";

function friendly(message = "") {
  if (/invalid login credentials/i.test(message)) return "Email or password is incorrect.";
  if (/already registered|already exists/i.test(message)) return "An account with this email already exists. Sign in instead.";
  if (/not confirmed/i.test(message)) return "Confirm your email address before signing in.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  if (/failed to fetch|network/i.test(message)) return "Cannot reach the server. Check your connection and try again.";
  return message || "Could not complete the request. Try again.";
}

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
  }, [loading, user, router]);

  function validate() {
    const e = {};
    if (!isEmail(email.trim())) e.email = "Enter a valid email address.";
    if (password.length < (isSignup ? 8 : 1)) e.password = isSignup ? "Use at least 8 characters." : "Enter your password.";
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    setFormError("");
    setNotice("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      if (isSignup) {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) setNotice("Account created. Open the confirmation link we emailed you, then sign in.");
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setFormError(friendly(err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel narrow">
      <h1 style={{ fontSize: "1.9rem" }}>{isSignup ? "Create an account" : "Sign in"}</h1>
      {isDemoMode && (
        <div className="alert alert-ok" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Local Standalone Mode:</strong> Test with any email/password, or click to autofill:
          </p>
          <div className="row" style={{ gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEmail("admin@malnad.com");
                setPassword("admin123");
              }}
            >
              Fill Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEmail("customer@malnad.com");
                setPassword("customer123");
              }}
            >
              Fill Customer
            </button>
          </div>
        </div>
      )}
      <form onSubmit={submit} noValidate className="stack" style={{ marginTop: "1.25rem" }}>
        {formError && <div className="alert alert-error" role="alert">{formError}</div>}
        {notice && <div className="alert alert-ok" role="status">{notice}</div>}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={isSignup ? "At least 8 characters." : undefined}
        />
        <button className="btn btn-block" disabled={busy}>
          {busy ? "Please wait" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="muted small" style={{ marginTop: "1rem" }}>
        {isSignup ? (
          <>Already registered? <Link href="/login">Sign in</Link></>
        ) : (
          <>New customer? <Link href="/signup">Create an account</Link></>
        )}
      </p>
    </div>
  );
}
