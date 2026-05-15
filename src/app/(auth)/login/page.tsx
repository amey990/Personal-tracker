"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AstroImage from "./Astro.png";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f0ff 0%, #eef2ff 30%, #fce7f3 60%, #f0f9ff 100%);
          padding: 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-card {
          display: flex;
          width: 100%;
          max-width: 960px;
          min-height: 560px;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.06),
            0 8px 24px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          overflow: hidden;
          position: relative;
        }

        /* Left side - Form */
        .login-form-section {
          flex: 1;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .login-heading {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 8px;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }

        .login-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 32px;
          font-weight: 400;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .form-input-wrapper {
          position: relative;
          margin-bottom: 20px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          color: #111827;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .form-input:focus {
          border-color: #a78bfa;
          box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.12);
          background: #ffffff;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #6b7280;
        }

        .form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #6b7280;
          user-select: none;
        }

        .remember-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid rgba(0, 0, 0, 0.15);
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .remember-checkbox.checked {
          background: #111827;
          border-color: #111827;
        }

        .forgot-link {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #7c3aed;
        }

        .signin-btn {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          background: #111827;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .signin-btn:hover {
          background: #1f2937;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .signin-btn:active {
          transform: translateY(0);
        }

        .signin-btn:disabled {
          background: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .google-btn {
          width: 100%;
          padding: 13px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.8);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: inherit;
        }

        .google-btn:hover {
          background: #ffffff;
          border-color: rgba(0, 0, 0, 0.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .login-footer {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          margin-top: 28px;
        }

        .login-footer a {
          color: #111827;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-footer a:hover {
          color: #7c3aed;
        }

        .error-box {
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 16px;
          font-weight: 500;
        }

        /* Right side - Image */
        .login-image-section {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Gradient blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.7;
          animation: blobFloat 8s ease-in-out infinite;
        }

        .blob-1 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #f472b6, #ec4899);
          top: 10%;
          right: 5%;
          animation-delay: 0s;
        }

        .blob-2 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #67e8f9, #22d3ee);
          bottom: 15%;
          left: 5%;
          animation-delay: -3s;
        }

        .blob-3 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #c4b5fd, #a78bfa);
          top: 50%;
          right: 30%;
          animation-delay: -5s;
        }

        .blob-4 {
          width: 180px;
          height: 180px;
          background: linear-gradient(135deg, #fda4af, #fb7185);
          bottom: 30%;
          right: 10%;
          animation-delay: -2s;
        }

        .blob-5 {
          width: 160px;
          height: 160px;
          background: linear-gradient(135deg, #93c5fd, #60a5fa);
          top: 20%;
          left: 20%;
          animation-delay: -4s;
        }

        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15px, -20px) scale(1.05); }
          66% { transform: translate(-10px, 15px) scale(0.95); }
        }

        .astronaut-image {
          position: relative;
          z-index: 2;
          width: 85%;
          max-width: 400px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15));
          animation: astronautFloat 6s ease-in-out infinite;
        }

        @keyframes astronautFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .login-page {
            min-height: 100dvh;
            align-items: flex-start;
            padding: 14px;
            overflow-y: auto;
          }

          .login-card {
            flex-direction: column;
            max-width: 390px;
            min-height: auto;
            border-radius: 24px;
          }

          .login-form-section {
            padding: 20px 22px 24px;
          }

          .login-image-section {
            height: 154px;
            order: -1;
          }

          .astronaut-image {
            width: 58%;
            max-width: 210px;
            animation: none;
            filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.22));
          }

          .login-heading {
            font-size: 24px;
            margin-bottom: 4px;
          }

          .login-subtitle {
            font-size: 12px;
            margin-bottom: 18px;
          }

          .form-label {
            font-size: 12px;
            margin-bottom: 6px;
          }

          .form-input-wrapper {
            margin-bottom: 14px;
          }

          .form-input {
            min-height: 44px;
            padding: 10px 14px;
            border-radius: 11px;
            font-size: 13px;
          }

          .form-row {
            margin-bottom: 16px;
          }

          .remember-label,
          .forgot-link {
            font-size: 11px;
          }

          .remember-checkbox {
            width: 16px;
            height: 16px;
          }

          .signin-btn,
          .google-btn {
            min-height: 44px;
            padding: 11px;
            border-radius: 12px;
            font-size: 13px;
          }

          .signin-btn {
            margin-bottom: 9px;
          }

          .login-footer {
            margin-top: 18px;
            font-size: 12px;
          }

          .blob {
            filter: blur(34px);
          }

          .blob-1 { width: 170px; height: 170px; top: -20%; right: 6%; }
          .blob-2 { width: 150px; height: 150px; bottom: -30%; left: 8%; }
          .blob-3 { width: 110px; height: 110px; }
          .blob-4,
          .blob-5 { display: none; }
        }

        @media (max-width: 380px) {
          .login-page {
            padding: 10px;
          }

          .login-form-section {
            padding: 18px 18px 22px;
          }

          .login-image-section {
            height: 128px;
          }

          .login-heading {
            font-size: 22px;
          }
        }

        /* ===== Dark Mode ===== */
        [data-theme="dark"] .login-page {
          background: linear-gradient(135deg, #0f0a1a 0%, #0d0d1a 30%, #1a0a1a 60%, #0a0f1a 100%);
        }

        [data-theme="dark"] .login-card {
          background: rgba(20, 20, 35, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.4),
            0 8px 24px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .login-heading {
          color: #f0f0ff;
        }

        [data-theme="dark"] .login-subtitle {
          color: #7070a0;
        }

        [data-theme="dark"] .form-label {
          color: #a0a0c0;
        }

        [data-theme="dark"] .form-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          color: #f0f0ff;
        }

        [data-theme="dark"] .form-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
          background: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .form-input::placeholder {
          color: #4a4a6a;
        }

        [data-theme="dark"] .password-toggle {
          color: #4a4a6a;
        }

        [data-theme="dark"] .password-toggle:hover {
          color: #7070a0;
        }

        [data-theme="dark"] .remember-label {
          color: #7070a0;
        }

        [data-theme="dark"] .remember-checkbox {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .remember-checkbox.checked {
          background: #8b5cf6;
          border-color: #8b5cf6;
        }

        [data-theme="dark"] .forgot-link {
          color: #c0c0e0;
        }

        [data-theme="dark"] .forgot-link:hover {
          color: #a78bfa;
        }

        [data-theme="dark"] .signin-btn {
          background: #8b5cf6;
          color: #ffffff;
        }

        [data-theme="dark"] .signin-btn:hover {
          background: #7c3aed;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }

        [data-theme="dark"] .signin-btn:disabled {
          background: #1a1a28;
          color: #3a3a55;
        }

        [data-theme="dark"] .google-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          color: #c0c0e0;
        }

        [data-theme="dark"] .google-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        [data-theme="dark"] .login-footer {
          color: #4a4a6a;
        }

        [data-theme="dark"] .login-footer a {
          color: #c0c0e0;
        }

        [data-theme="dark"] .login-footer a:hover {
          color: #a78bfa;
        }

        [data-theme="dark"] .error-box {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.25);
          color: #f87171;
        }

        [data-theme="dark"] .blob {
          opacity: 0.4;
        }

        [data-theme="dark"] .astronaut-image {
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4));
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          {/* Left Side - Form */}
          <div className="login-form-section">
            <h1 className="login-heading">Welcome back</h1>
            <p className="login-subtitle">Continue with one of the following options</p>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <label className="form-label" htmlFor="login-email">Email</label>
              <div className="form-input-wrapper">
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="form-input-wrapper">
                <input
                  id="login-password"
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password 8-16 character"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "48px" }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Remember / Forgot */}
              <div className="form-row">
                <label className="remember-label" onClick={() => setRememberMe(!rememberMe)}>
                  <span className={`remember-checkbox ${rememberMe ? "checked" : ""}`}>
                    {rememberMe && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                  Remember me
                </label>
                <span className="forgot-link" style={{ cursor: "pointer" }}>Forgot Password?</span>
              </div>

              {/* Error */}
              {error && (
                <div className="error-box">{error}</div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="signin-btn"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogle}
              className="google-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Footer */}
            <p className="login-footer">
              No account?{" "}
              <Link href="/signup">Sign up</Link>
            </p>
          </div>

          {/* Right Side - Image */}
          <div className="login-image-section">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            <div className="blob blob-4" />
            <div className="blob blob-5" />
            <Image
              src={AstroImage}
              alt="Astronaut floating in space"
              className="astronaut-image"
              priority
              placeholder="blur"
            />
          </div>
        </div>
      </div>
    </>
  );
}
