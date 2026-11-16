import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isDemoMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("placeholder") ||
  supabaseUrl.trim() === "";

class MockSupabaseAuth {
  constructor() {
    this.listeners = new Set();
  }

  _getSession() {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("malnad_demo_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  _saveSession(session) {
    if (typeof window === "undefined") return;
    try {
      if (session) {
        localStorage.setItem("malnad_demo_session", JSON.stringify(session));
      } else {
        localStorage.removeItem("malnad_demo_session");
      }
    } catch {}
    this.listeners.forEach((cb) => {
      try {
        cb(session ? "SIGNED_IN" : "SIGNED_OUT", session);
      } catch (err) {
        console.error("Auth listener error:", err);
      }
    });
  }

  async getSession() {
    return { data: { session: this._getSession() }, error: null };
  }

  onAuthStateChange(callback) {
    this.listeners.add(callback);
    const session = this._getSession();
    setTimeout(() => {
      try {
        callback(session ? "SIGNED_IN" : "INITIAL_SESSION", session);
      } catch (err) {
        console.error("Auth listener error:", err);
      }
    }, 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }

  async signInWithPassword({ email, password }) {
    if (!email) throw new Error("Email is required.");
    const isAdmin = email.toLowerCase().includes("admin");
    const role = isAdmin ? "admin" : "customer";
    const user = {
      id: isAdmin
        ? "00000000-0000-0000-0000-000000000001"
        : "00000000-0000-0000-0000-000000000002",
      email: email.trim(),
      role,
      user_metadata: { role },
    };
    const session = {
      access_token: `demo-token-${role}-${user.id}`,
      token_type: "bearer",
      user,
    };
    this._saveSession(session);
    return { data: { user, session }, error: null };
  }

  async signUp({ email, password }) {
    return this.signInWithPassword({ email, password });
  }

  async signOut() {
    this._saveSession(null);
    return { error: null };
  }
}

export const supabase = isDemoMode
  ? { auth: new MockSupabaseAuth() }
  : createClient(supabaseUrl, supabaseAnonKey);
