"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
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

        {done ? (
          /* Success state */
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#10b98120",
                border: "1px solid #10b98140",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "24px",
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              Check your email
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text2)",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              We sent a confirmation link to{" "}
              <strong style={{ color: "var(--text)" }}>{email}</strong>. Click
              it to activate your account.
            </p>
            <Link
              href="/login"
              style={{
                display: "block",
                padding: "12px",
                borderRadius: "10px",
                background: "#7c3aed",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: "6px",
                letterSpacing: "-0.02em",
              }}
            >
              Create account
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text2)",
                marginBottom: "32px",
              }}
            >
              Start tracking your habits today
            </p>

            <form
              onSubmit={handleSignup}
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
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text3)",
                    marginTop: "6px",
                  }}
                >
                  At least 6 characters
                </p>
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
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                fontSize: "13px",
                color: "var(--text3)",
                marginTop: "24px",
              }}
            >
              Have an account?{" "}
              <Link
                href="/login"
                style={{
                  color: "#a855f7",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
