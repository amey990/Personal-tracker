"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--page)",
        padding: "16px",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "18px" }}>
              T
            </span>
          </div>
          <span
            style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}
          >
            Tracker
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "var(--text)",
            marginBottom: "6px",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text2)",
            marginBottom: "32px",
          }}
        >
          Sign in to your tracker
        </p>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text2)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                background: "var(--card2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text2)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                background: "var(--card2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#ef444415",
                border: "1px solid #ef444430",
                color: "#ef4444",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              background: loading ? "var(--card2)" : "#7c3aed",
              color: loading ? "var(--text3)" : "#fff",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all .2s",
              marginTop: "4px",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        
        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "var(--text3)",
            marginTop: "24px",
          }}
        >
          No account?{" "}
          <Link
            href="/signup"
            style={{
              color: "#a855f7",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
