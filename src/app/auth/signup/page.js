"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/app/context/ToastContext";

export default function SignupPage() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { showToast } = useToast();

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }
        if (password.length < 6) {
            showToast("Password must be at least 6 characters.", "error");
            return;
        }

        setLoading(true);
        const supabase = createClient();
        if (!supabase) {
            showToast("Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with valid Supabase values.", "error");
            setLoading(false);
            return;
        }

        try {
            const { data: signUpData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                    }
                },
            });

            if (authError) {
                showToast(authError.message || "Signup failed.", "error");
                setLoading(false);
                return;
            }

            // upsert profile with role 'customer' and names
            const userObj = signUpData?.user ?? null;
            if (userObj) {
                const { error: upsertErr } = await supabase.from("profiles").upsert({
                    id: userObj.id,
                    email: userObj.email,
                    role: "customer",
                    first_name: firstName,
                    last_name: lastName
                });
                if (upsertErr) console.warn("Profile upsert error:", upsertErr.message || upsertErr);
            } else {
                // fallback: try to get current user and upsert
                const { data } = await supabase.auth.getUser();
                const u = data?.user ?? null;
                if (u) {
                    const { error: upsertErr } = await supabase.from("profiles").upsert({
                        id: u.id,
                        email: u.email,
                        role: "customer",
                        first_name: firstName,
                        last_name: lastName
                    });
                    if (upsertErr) console.warn("Profile upsert error:", upsertErr.message || upsertErr);
                }
            }

            setSuccess(true);
        } catch (err) {
            console.error(err);
            showToast(err?.message || "An unexpected error occurred.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-bg-pattern" aria-hidden="true" />
                <div className="auth-card auth-success-card">
                    <div className="auth-success-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 className="auth-success-title">Check your inbox</h2>
                    <p className="auth-success-text">
                        We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account and start shopping.
                    </p>
                    <Link href="/auth/login" className="auth-submit-btn" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: "32px" }}>
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-pattern" aria-hidden="true" />

            <Link href="/" className="auth-back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back to Store
            </Link>

            <div className="auth-card">
                <div className="auth-brand">
                    <span className="auth-logo">PRJ TRAP VAULT</span>
                    <p className="auth-brand-sub">Create your account</p>
                </div>

                <form onSubmit={handleSignup} className="auth-form" id="signup-form">
                    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                        <div className="auth-field" style={{ flex: 1 }}>
                            <label htmlFor="signup-firstname" className="auth-label">First Name</label>
                            <input
                                id="signup-firstname"
                                type="text"
                                required
                                placeholder="First Name"
                                className="auth-input"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="auth-field" style={{ flex: 1 }}>
                            <label htmlFor="signup-lastname" className="auth-label">Last Name</label>
                            <input
                                id="signup-lastname"
                                type="text"
                                required
                                placeholder="Last Name"
                                className="auth-input"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-email" className="auth-label">Email Address</label>
                        <input
                            id="signup-email"
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
                        <label htmlFor="signup-password" className="auth-label">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="Min. 6 characters"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-confirm-password" className="auth-label">Confirm Password</label>
                        <input
                            id="signup-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="Repeat your password"
                            className="auth-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>



                    <button
                        id="signup-submit-btn"
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="auth-spinner" /> : "Create Account"}
                    </button>
                </form>

                <p className="auth-redirect-text">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="auth-redirect-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
