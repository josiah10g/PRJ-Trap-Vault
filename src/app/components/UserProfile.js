"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserProfile() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [error, setError] = useState(null);
    const menuRef = useRef(null);

    // Close menu when clicking anywhere outside the component
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showMenu]);

    useEffect(() => {
        const supabase = createClient();
        if (!supabase) {
            setLoading(false);
            return;
        }

        const getSession = async () => {
            try {
                const { data, error: authError } = await supabase.auth.getUser();
                if (authError) {
                    console.warn("Auth error:", authError);
                    setUser(null);
                    setRole(null);
                    setLoading(false);
                    return;
                }

                const currentUser = data?.user;
                if (currentUser) {
                    setUser(currentUser);
                    setLoading(false);

                    const { data: profileData, error: profileError } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", currentUser.id)
                        .single();

                    if (profileError) {
                        console.warn("Profile fetch error:", profileError.message);
                        setRole("customer");
                    } else {
                        setRole(profileData?.role || "customer");
                    }
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Session check error:", err);
                setError(err?.message);
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                setLoading(false);
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single();
                setRole(profileError ? "customer" : (profileData?.role || "customer"));
            } else {
                setUser(null);
                setRole(null);
                setLoading(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleLogout = () => {
        const supabase = createClient();

        // 1. Immediately wipe localStorage session keys
        if (typeof window !== "undefined") {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith("sb-")) {
                    localStorage.removeItem(key);
                }
            });

            // 2. Wipe session cookies
            document.cookie.split(";").forEach(c => {
                const name = c.split("=")[0].trim();
                if (name.includes("sb-") || name.includes("supabase")) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                }
            });
        }

        // 3. Reset component state immediately
        setUser(null);
        setRole(null);
        setShowMenu(false);

        // 4. Fire server-side signOut in background — never blocks the UI
        if (supabase) {
            supabase.auth.signOut().catch(err => {
                console.error("Sign out background error:", err);
            });
        }

        // 5. Hard redirect to home so all server state is cleared
        window.location.href = "/";
    };

    if (loading) {
        return <div className="profile-loading">Checking auth...</div>;
    }

    if (!user) {
        return (
            <Link href="/auth/login" className="action-btn header-sign-in font-sans">
                Sign In
            </Link>
        );
    }

    const firstName = user?.user_metadata?.first_name || "";
    const lastName = user?.user_metadata?.last_name || "";
    let fullName = (firstName + " " + lastName).trim();
    if (!fullName && user?.email) {
        fullName = user.email.split("@")[0];
        fullName = fullName.charAt(0).toUpperCase() + fullName.slice(1);
    }
    const displayName = firstName || fullName;

    return (
        <div className="user-profile" ref={menuRef}>
            <button
                className="profile-button"
                onClick={() => setShowMenu(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={showMenu}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="profile-email">{displayName}</span>
            </button>

            {showMenu && (
                <div className="profile-menu">
                    <div className="profile-menu-header">
                        <div className="profile-user-info">
                            <p className="profile-email-display" style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{fullName}</p>
                            <p className="profile-email-display" style={{ color: "var(--text-secondary)", fontSize: "0.8rem", wordBreak: "break-all" }}>{user.email}</p>
                            <p className="profile-role" style={{ marginTop: "4px" }}>
                                Role: <span className={`role-badge role-${role}`}>{role || "customer"}</span>
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="profile-error" role="alert">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Session warning — please sign out and sign in again.
                        </div>
                    )}

                    <div className="profile-menu-actions">
                        {role === "admin" && (
                            <Link href="/admin" className="profile-menu-item profile-admin-link" onClick={() => setShowMenu(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 6V2m0 20v-4M6 12H2m20 0h-4M7.8 7.8L4.9 4.9M19.1 19.1l-2.9-2.9M4.9 19.1l2.9-2.9M19.1 4.9l-2.9 2.9" />
                                </svg>
                                Admin Dashboard
                            </Link>
                        )}
                        <button onClick={handleLogout} className="profile-menu-item profile-logout-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
