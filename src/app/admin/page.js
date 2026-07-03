"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useToast } from "@/app/context/ToastContext";

const EMPTY_FORM = {
    name: "",
    category: "tees",
    price: "",
    image: "",
    description: "",
};

export default function AdminPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tableError, setTableError] = useState("");
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const { showToast } = useToast();

    const refreshProducts = useCallback(async () => {
        const supabase = createClient();
        if (!supabase) return;
        const { data: prods } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });
        setProducts(prods ?? []);
    }, []);

    useEffect(() => {
        const supabase = createClient();
        if (!supabase) { setLoading(false); return; }

        let mounted = true;

        async function init() {
            try {
                const { data, error: authErr } = await supabase.auth.getUser();
                if (authErr) throw authErr;

                const u = data?.user ?? null;
                if (!mounted) return;
                if (!u) { setUser(null); setLoading(false); return; }

                let profileRole = null;
                try {
                    const { data: profile, error: profileErr } = await supabase
                        .from("profiles").select("role").eq("id", u.id).single();
                    if (!profileErr) profileRole = profile?.role ?? null;
                } catch (e) {
                    console.warn("Profile fetch error", e);
                }
                setUser({ ...u, role: profileRole });

                try {
                    const { data: prods, error: fetchErr } = await supabase
                        .from("products").select("*").order("created_at", { ascending: false });
                    if (fetchErr) throw fetchErr;
                    setProducts(prods ?? []);
                } catch (e) {
                    console.warn("Products fetch error", e);
                    setTableError(
                        "Could not load products from your Supabase database. Make sure the 'products' table exists and RLS policies allow admin access."
                    );
                }
            } catch (err) {
                console.error("Admin init error:", err);
                showToast(err.message || "Failed to connect to database.", "error");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        init();
        return () => { mounted = false; };
    }, []);

    // Convert selected file to base64 and set as image
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            showToast("Please select a JPG, PNG, WEBP or GIF image.", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast("Image must be smaller than 5MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result;
            setImagePreview(base64);
            setForm(prev => ({ ...prev, image: base64 }));
        };
        reader.onerror = () => showToast("Failed to read file.", "error");
        reader.readAsDataURL(file);
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        setForm({
            name: product.name ?? "",
            category: product.category ?? "tees",
            price: product.price ?? "",
            image: product.image ?? "",
            description: product.description ?? "",
        });
        setImagePreview(product.image ?? "");
        document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const supabase = createClient();
        if (!supabase) return showToast("Supabase not configured.", "error");
        if (!user || user.role !== "admin") return showToast("You are not authorized.", "error");
        if (!form.name.trim()) return showToast("Product name is required.", "error");
        if (!form.price || isNaN(Number(form.price))) return showToast("Enter a valid price.", "error");

        setSaving(true);
        const payload = {
            name: form.name.trim(),
            category: form.category,
            price: Number(form.price),
            image: form.image || "",
            description: form.description.trim(),
        };

        try {
            if (editingId) {
                const { error } = await supabase.from("products").update(payload).eq("id", editingId);
                if (error) throw error;
                showToast("Product updated!", "success");
            } else {
                const { error } = await supabase.from("products").insert(payload);
                if (error) throw error;
                showToast("Product added to store!", "success");
            }
            handleCancelEdit();
            await refreshProducts();
        } catch (err) {
            showToast(err.message || String(err), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (prodId) => {
        if (!window.confirm("Delete this product? This cannot be undone.")) return;
        const supabase = createClient();
        if (!supabase) return showToast("Supabase not configured.", "error");
        if (!user || user.role !== "admin") return showToast("You are not authorized.", "error");

        try {
            const { error } = await supabase.from("products").delete().eq("id", prodId);
            if (error) throw error;
            showToast("Product deleted.", "success");
            if (editingId === prodId) handleCancelEdit();
            await refreshProducts();
        } catch (err) {
            showToast(err.message || String(err), "error");
        }
    };

    // ---- Guards ----
    if (loading) return (
        <div style={{ padding: "80px clamp(14px, 4vw, 24px)", textAlign: "center" }}>
            <div className="profile-loading">Loading admin dashboard...</div>
        </div>
    );

    if (!user) return (
        <div style={{ padding: "80px clamp(14px, 4vw, 24px)", textAlign: "center" }}>
            <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>You need to be signed in to access this page.</p>
            <Link href="/auth/login" className="btn btn-primary" style={{ display: "inline-flex" }}>Sign In</Link>
        </div>
    );

    if (user.role !== "admin") return (
        <div style={{ padding: "80px clamp(14px, 4vw, 24px)", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>Your account does not have admin privileges.</p>
        </div>
    );

    const activeImageSrc = imagePreview || (!imagePreview && form.image) || null;

    return (
        <main style={{ padding: "40px clamp(14px, 4vw, 24px)", maxWidth: 1000, margin: "0 auto" }}>

            {/* Page header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "var(--font-brand-family)", fontSize: "clamp(1.5rem, 4vw, 2rem)", marginBottom: 4 }}>
                    Admin Dashboard
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    Add or edit products — changes reflect instantly on the store.
                </p>
            </div>

            {tableError && (
                <div style={{ padding: "12px 16px", background: "rgba(220,38,38,0.1)", borderLeft: "4px solid #f87171", borderRadius: 4, marginBottom: 24, color: "#fca5a5", fontSize: "0.9rem" }}>
                    {tableError}
                </div>
            )}

            {/* ===== PRODUCT FORM ===== */}
            <section
                id="product-form"
                style={{
                    marginBottom: 48,
                    padding: "clamp(20px,5vw,32px)",
                    background: "var(--bg-secondary)",
                    border: `1px solid ${editingId ? "#fca5a5" : "var(--border-color)"}`,
                    borderRadius: 4,
                    transition: "border-color 0.2s"
                }}
            >
                <h2 style={{ fontSize: "1.05rem", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.05em", color: editingId ? "#fca5a5" : "var(--text-secondary)" }}>
                    {editingId ? "✏ Editing Product" : "+ Add New Product"}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>

                    {/* Name + Category */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
                        <input
                            className="auth-input"
                            placeholder="Product Name *"
                            required
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <select
                            className="auth-input"
                            value={form.category}
                            onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                        >
                            <option value="tees">Tees</option>
                            <option value="hoodies">Hoodies</option>
                            <option value="bottoms">Bottoms</option>
                            <option value="outerwear">Outerwear</option>
                            <option value="accessories">Accessories</option>
                        </select>
                    </div>

                    {/* Price */}
                    <input
                        className="auth-input"
                        placeholder="Price (₦) *"
                        required
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                        style={{ maxWidth: "min(100%, 300px)" }}
                    />

                    {/* Image Upload */}
                    <div style={{ border: "1px dashed var(--border-color-strong)", borderRadius: 4, padding: "clamp(14px, 3vw, 22px)" }}>
                        <p style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: 12 }}>
                            Product Image
                        </p>

                        {/* Preview */}
                        {activeImageSrc && (
                            <div style={{ marginBottom: 12 }}>
                                <img
                                    src={activeImageSrc}
                                    alt="Preview"
                                    style={{ width: "clamp(72px, 16vw, 110px)", height: "clamp(72px, 16vw, 110px)", objectFit: "cover", border: "1px solid var(--border-color)", borderRadius: 2, display: "block" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePreview("");
                                        setForm(prev => ({ ...prev, image: "" }));
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    style={{ marginTop: 6, background: "none", border: "none", color: "#f87171", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-sans-family)", padding: 0 }}
                                >
                                    ✕ Remove image
                                </button>
                            </div>
                        )}

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                            {/* File picker */}
                            <label style={{ cursor: "pointer" }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    style={{ display: "none" }}
                                    onChange={handleFileSelect}
                                />
                                <span className="btn btn-secondary" style={{ padding: "9px 18px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    Upload from Device
                                </span>
                            </label>

                            <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>or paste URL</span>

                            <input
                                className="auth-input"
                                placeholder="/images/product.jpg or https://..."
                                value={imagePreview ? "" : form.image}
                                onChange={e => {
                                    setForm(prev => ({ ...prev, image: e.target.value }));
                                    setImagePreview("");
                                }}
                                style={{ flex: 1, minWidth: "min(100%, 200px)" }}
                            />
                        </div>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 8 }}>Max 5MB · JPG, PNG, WEBP, GIF</p>
                    </div>

                    {/* Description */}
                    <textarea
                        className="auth-input"
                        placeholder="Product description (optional)"
                        rows={3}
                        value={form.description}
                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                        style={{ resize: "vertical", minHeight: 80 }}
                    />

                    {/* Submit / Cancel */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1, minWidth: "min(100%, 180px)" }}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : editingId ? "Update Product" : "Add Product to Store"}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" style={{ minWidth: 120 }}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* ===== PRODUCTS LIST ===== */}
            <section>
                <h2 style={{ fontSize: "1.05rem", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Store Products ({products.length})
                </h2>

                {products.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", padding: "24px 0", fontSize: "0.9rem" }}>
                        No products yet. Add one above — it will appear in the store immediately.
                    </p>
                ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                        {products.map(p => (
                            <div
                                key={p.id}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "auto 1fr auto",
                                    gap: "clamp(10px, 2vw, 16px)",
                                    alignItems: "center",
                                    padding: "clamp(12px, 3vw, 16px)",
                                    border: `1px solid ${editingId === p.id ? "#fca5a5" : "var(--border-color)"}`,
                                    borderRadius: 4,
                                    background: editingId === p.id ? "rgba(220,38,38,0.04)" : "var(--bg-secondary)",
                                    transition: "border-color 0.2s"
                                }}
                            >
                                {/* Thumbnail */}
                                {p.image ? (
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        style={{ width: "clamp(48px, 10vw, 64px)", height: "clamp(48px, 10vw, 64px)", objectFit: "cover", border: "1px solid var(--border-color)", borderRadius: 2, flexShrink: 0 }}
                                    />
                                ) : (
                                    <div style={{ width: "clamp(48px, 10vw, 64px)", height: "clamp(48px, 10vw, 64px)", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-sans-family)" }}>{p.name}</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                                        {p.category} · ₦{Number(p.price).toLocaleString()}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    <button
                                        onClick={() => editingId === p.id ? handleCancelEdit() : handleEdit(p)}
                                        style={{
                                            background: editingId === p.id ? "rgba(255,255,255,0.06)" : "transparent",
                                            color: editingId === p.id ? "#fca5a5" : "var(--text-secondary)",
                                            border: "1px solid var(--border-color)",
                                            padding: "6px 14px",
                                            cursor: "pointer",
                                            borderRadius: 2,
                                            fontSize: "0.75rem",
                                            fontFamily: "var(--font-mono-family)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {editingId === p.id ? "Cancel" : "Edit"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        style={{
                                            background: "rgba(220,38,38,0.12)",
                                            color: "#f87171",
                                            border: "1px solid rgba(220,38,38,0.3)",
                                            padding: "6px 14px",
                                            cursor: "pointer",
                                            borderRadius: 2,
                                            fontSize: "0.75rem",
                                            fontFamily: "var(--font-mono-family)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
