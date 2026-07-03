"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  // Client-side states
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbProducts, setDbProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [user, setUser] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState("");

  // Only use DB products — no hardcoded fallback
  const allProducts = dbProducts;

  const products = useMemo(() => {
    let filtered = allProducts;
    if (activeCategory !== "all") {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return filtered;
  }, [activeCategory, searchQuery, allProducts]);

  // Lock body scroll when overlays are open
  useEffect(() => {
    const isLocked = isMenuOpen || isCartOpen || Boolean(selectedProduct);
    document.body.classList.toggle("scroll-locked", isLocked);
    return () => document.body.classList.remove("scroll-locked");
  }, [isCartOpen, selectedProduct]);

  // Load products from Supabase and session on mount
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setProductsLoading(false); return; }

    let mounted = true;

    // Fetch products from Supabase
    async function fetchProducts() {
      try {
        const { data: prods, error } = await supabase.from("products").select("*");
        if (!error && prods && mounted) {
          setDbProducts(prods);
        }
      } catch (e) {
        console.warn("Products fetch error:", e);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    }

    async function initUser() {
      try {
        const { data } = await supabase.auth.getUser();
        const userObj = data?.user ?? null;
        if (!mounted) return;
        if (!userObj) {
          setUser(null);
          return;
        }

        // Try to fetch profile (role) from "profiles" table; upsert default customer if missing
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userObj.id)
          .single();

        if (profileErr && profileErr.code !== "PGRST116") {
          // ignore single-row not found error, surface others
          console.warn("Profile fetch error:", profileErr.message || profileErr);
        }

        if (!profile) {
          // create or update a basic profile with role 'customer'
          await supabase.from("profiles").upsert({ id: userObj.id, email: userObj.email, role: "customer" });
          setUser({ ...userObj, role: "customer" });
        } else {
          setUser({ ...userObj, role: profile.role });
        }
      } catch (e) {
        console.error("Auth init error", e);
      }
    }

    fetchProducts();
    initUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      if (!u) {
        setUser(null);
        return;
      }

      try {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", u.id).single();
        if (!profile) {
          await supabase.from("profiles").upsert({ id: u.id, email: u.email, role: "customer" });
          setUser({ ...u, role: "customer" });
        } else {
          setUser({ ...u, role: profile.role });
        }
      } catch (err) {
        console.warn("Auth state profile sync error", err);
        setUser(u);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  // Load cart from localStorage after hydration
  useEffect(() => {
    const savedCart = localStorage.getItem("trap_vault_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        requestAnimationFrame(() => setCart(parsed));
      } catch (e) {
        console.error("Error loading cart", e);
      }
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("trap_vault_cart", JSON.stringify(newCart));
  };

  // Cart Handlers
  const addToCart = (product, size) => {
    const existingIndex = cart.findIndex(
      item => item.id === product.id && item.size === size
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      saveCart(newCart);
    } else {
      saveCart([...cart, { ...product, size, quantity: 1 }]);
    }

    // Close detail modal, open cart drawer
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, size, change) => {
    const newCart = cart.map(item => {
      if (item.id === productId && item.size === size) {
        const newQty = item.quantity + change;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeFromCart = (productId, size) => {
    saveCart(cart.filter(item => !(item.id === productId && item.size === size)));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Format currency helper
  const formatNaira = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutMsg("Checkout is temporarily disabled. We'll enable payment later.");
  };

  return (
    <>
      {/* status banner removed per request */}

      {/* Floating Cart Button */}
      <button
        className="action-btn floating-cart-btn"
        onClick={() => setIsCartOpen(true)}
        aria-label="Open Shopping Cart"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {cart.length > 0 && (
          <span className="cart-badge">
            {cart.reduce((total, item) => total + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Hero Banner */}
      <section
        className="hero"
        style={{ backgroundImage: "url('/images/IMG-20260701-WA0039.jpg')" }}
      >
        <div className="hero-overlay" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-content">
            <span className="hero-tag">Vault Release / 2026</span>
            <h1 className="hero-title">
              <span className="hero-title-line">Enter The</span>
              <span className="hero-title-line hero-title-line--wide">Monochromatic</span>
              <span className="hero-title-line">Vault</span>
            </h1>
            <p className="hero-subtitle">
              Heavyweight cottons. Custom industrial panels. Curated streetwear for the boldest style minds in Nigeria. Purely black & white.
            </p>
            <a href="#catalog" className="btn btn-primary hero-cta">Shop The Collection</a>
          </div>
        </div>
      </section>

      {/* Catalog Filters Section */}
      <section id="catalog" className="filter-section">
        <div className="container">
          <div className="filter-container">
            <ul className="category-list">
              {["all", "hoodies", "tees", "bottoms", "outerwear"].map(cat => (
                <li key={cat}>
                  <button
                    className={`category-tab ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>

            <div className="search-wrapper">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search vault..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product List Grid */}
      <main className="container">
        {productsLoading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-sans-family)", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.85rem" }}>
            Loading collection...
          </div>
        ) : products.length === 0 && allProducts.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-sans-family)", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.85rem" }}>
            Collection coming soon. Check back shortly.
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-sans-family)", textTransform: "uppercase" }}>
            No items matching your search.
          </div>
        ) : (
          <div className="product-grid">
            {products.map(prod => (
              <div
                key={prod.id}
                className="product-card"
                onClick={() => {
                  setSelectedProduct(prod);
                  const firstSize = prod.sizes
                    ? prod.sizes.split(",").map(s => s.trim()).filter(Boolean)[0] ?? "M"
                    : "M";
                  setSelectedSize(firstSize);
                }}
              >
                <div className="product-image-container">
                  <Image
                    src={prod.image}
                    alt={prod.name}
                    width={420}
                    height={420}
                    className="product-image"
                  />
                  <div className="quick-add-overlay">
                    <button className="quick-add-btn">Quick View</button>
                  </div>
                </div>
                <div className="product-info">
                  <div>
                    <h3 className="product-title">{prod.name}</h3>
                    <span className="product-category">{prod.category}</span>
                  </div>
                  <span className="product-price">{formatNaira(prod.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Slide-out Cart Drawer */}
      <div className={`cart-drawer-overlay ${isCartOpen ? "open" : ""}`} onClick={() => setIsCartOpen(false)}></div>
      <div className={`cart-drawer ${isCartOpen ? "open" : ""}`}>
        <div className="cart-header">
          <h2 className="cart-title">Your Cart</h2>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)} aria-label="Close Cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="cart-items-wrapper">
          {cart.length === 0 ? (
            <p className="cart-empty-message">Your vault bag is empty</p>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="cart-item">
                <Image src={item.image} alt={item.name} width={80} height={80} className="cart-item-image" />
                <div className="cart-item-info">
                  <h4 className="cart-item-title">{item.name}</h4>
                  <p className="cart-item-meta font-mono">SIZE: {item.size}</p>
                  <div className="cart-item-actions">
                    <div className="qty-selector">
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.size, -1)}>-</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.size, 1)}>+</button>
                    </div>
                    <button className="cart-remove-btn" onClick={() => removeFromCart(item.id, item.size)}>Remove</button>
                  </div>
                </div>
                <div className="cart-item-price font-mono">
                  {formatNaira(item.price * item.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals">
              <div className="totals-row">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>
              <div className="totals-row grand-total">
                <span>Total</span>
                <span className="font-mono">{formatNaira(getSubtotal())}</span>
              </div>
            </div>
            {checkoutMsg && (
              <p style={{ fontFamily: "var(--font-sans-family)", fontSize: "0.8rem", color: "#f87171", marginBottom: "8px", textAlign: "center" }}>
                {checkoutMsg}
              </p>
            )}
            <button
              className="btn btn-primary checkout-btn"
              onClick={handleCheckout}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            >
              Checkout Coming Soon
            </button>
          </div>
        )}

      </div>

      {/* Product Detail Modal */}
      <div className={`modal ${selectedProduct ? "open" : ""}`}>
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}></div>
        <div className="modal-content">
          <button className="modal-close-btn" onClick={() => setSelectedProduct(null)} aria-label="Close Details">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {selectedProduct && (
            <div className="detail-grid">
              <div className="detail-image-wrapper">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  width={520}
                  height={520}
                  className="detail-image"
                />
              </div>

              <div className="detail-info">
                <span className="detail-tag font-mono">{selectedProduct.category}</span>
                <h2 className="detail-title">{selectedProduct.name}</h2>
                <div className="detail-price font-mono">{formatNaira(selectedProduct.price)}</div>

                <p className="detail-desc">{selectedProduct.description}</p>

                <div className="size-section">
                  <h4 className="size-section-title">Select Size</h4>
                  <div className="size-grid">
                    {["S", "M", "L", "XL"].map(sz => (
                      <button
                        key={sz}
                        className={`size-option ${selectedSize === sz ? "active" : ""}`}
                        onClick={() => setSelectedSize(sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => addToCart(selectedProduct, selectedSize)}
                  style={{ width: "100%" }}
                >
                  Add to cart bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="logo">PRJ TRAP VAULT</Link>
              <p className="footer-tagline">Premium streetwear designed with raw structures and clean black-and-white silhouettes.</p>
            </div>

            <div className="footer-links">
              <h4>Explore</h4>
              <ul>
                <li><Link href="/store">Collections</Link></li>
                <li><Link href="/about">Philosophy</Link></li>
                <li><Link href="/store">Sizing Guide</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <ul>
                <li><Link href="/contact">Order Tracking</Link></li>
                <li><Link href="/contact">Return Policy</Link></li>
                <li><Link href="/contact">FAQs</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Newsletter</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "12px", lineHeight: "1.4" }}>
                Notifications for upcoming drops are available — sign up in the dashboard.
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">&copy; 2026 PRJ TRAP VAULT. All rights reserved.</p>
            <div className="payment-methods">
              <span>Checkout disabled for now</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
