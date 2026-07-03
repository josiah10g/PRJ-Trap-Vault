"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/app/context/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      showToast(
        "Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with valid Supabase values.",
        "error"
      );
      setLoading(false);
      return;
    }

    // Check if account/profile exists in profiles table
    try {
      const { data: profileCheck, error: checkError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (!profileCheck && !checkError) {
        showToast("Account doesn't exist. Please create an account.", "error");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Skipping account existence check:", err);
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      showToast(authError.message || "Invalid login credentials.");
      setLoading(false);
    } else {
      showToast("Login successful. Redirecting...", "success");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2500);
    }
  };

  return (
    <div className="auth-page">
      {/* Background pattern */}
      <div className="auth-bg-pattern" aria-hidden="true" />

      {/* Back to store link */}
      <Link href="/" className="auth-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Store
      </Link>

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span className="auth-logo">PRJ TRAP VAULT</span>
          <p className="auth-brand-sub">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form" id="login-form">
          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              placeholder="your@email.com"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="auth-redirect-text">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="auth-redirect-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
