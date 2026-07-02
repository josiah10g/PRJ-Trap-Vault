"use client";

import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// Pre-defined catalog mapped to reference images
const PRODUCTS = [
  {
    id: "p1",
    name: "Vault Signature Hoodie",
    category: "hoodies",
    price: 35000,
    image: "/images/IMG-20260701-WA0039.jpg",
    description: "Cozy heavy-weight French Terry cotton hoodie in matte black. Features custom puff-print brand logo across the chest, drop shoulders, and ribbed cuffs."
  },
  {
    id: "p2",
    name: "PRJ Premium Oversized Tee",
    category: "tees",
    price: 15000,
    image: "/images/IMG-20260701-WA0040.jpg",
    description: "Ultra-heavy cotton tee in faded vintage black. Thick ribbed neck collar, boxy drop-shoulder cut, and minimal brand label embroidered on the sleeve."
  },
  {
    id: "p3",
    name: "Utility Cargo Pants",
    category: "bottoms",
    price: 40000,
    image: "/images/IMG-20260701-WA0041.jpg",
    description: "Heavy-duty technical cargo pants featuring deep tactical side pockets, adjustable ankle toggles, and reinforced knee panelling."
  },
  {
    id: "p4",
    name: "Vault Mesh Lounge Shorts",
    category: "bottoms",
    price: 20000,
    image: "/images/IMG-20260701-WA0042.jpg",
    description: "Double-layered premium mesh shorts with custom script embroidery. Relaxed streetwear fit with elongated drawstrings and raw edge detailing."
  },
  {
    id: "p5",
    name: "PRJ Heavyweight Fleece Hoodie",
    category: "hoodies",
    price: 38000,
    image: "/images/IMG-20260701-WA0043.jpg",
    description: "High-density fleece hoodie in off-white. Double-lined hood, minimal central branding, and structured heavy drape."
  },
  {
    id: "p6",
    name: "Vault Panel Track Jacket",
    category: "outerwear",
    price: 45000,
    image: "/images/IMG-20260701-WA0044.jpg",
    description: "Windproof minimalist track jacket with high neck closure and raw contrast piping details. Inner mesh lining for breathability."
  },
  {
    id: "p7",
    name: "Street Heavy Joggers",
    category: "bottoms",
    price: 30000,
    image: "/images/IMG-20260701-WA0045.jpg",
    description: "Premium fleece sweatpants with elastic ankles, drawstring waist, and subtle branding. Perfect match for the signature hoodie collection."
  },
  {
    id: "p8",
    name: "Vault Boxy Graphic Tee",
    category: "tees",
    price: 16000,
    image: "/images/IMG-20260701-WA0046.jpg",
    description: "Heavyweight boxy fit tee with a custom industrial screenprint artwork on the back and brand initial logo on the front."
  }
];

export default function Home() {
  // Client-side states
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [user, setUser] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState("");

  const products = useMemo(() => {
    let filtered = PRODUCTS;
    if (activeCategory !== "all") {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [activeCategory, searchQuery]);

  // Lock body scroll when overlays are open
  useEffect(() => {
    const isLocked = isMenuOpen || isCartOpen || Boolean(selectedProduct);
    document.body.classList.toggle("scroll-locked", isLocked);
    return () => document.body.classList.remove("scroll-locked");
  }, [isMenuOpen, isCartOpen, selectedProduct]);

  // Load Supabase session on mount if configured
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener?.subscription?.unsubscribe();
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
      {/* Runtime status banner */}
      <div className="status-banner">
        Site functionality is temporarily limited: authentication and checkout are disabled until configuration is complete. Browse the collection, and contact us at <strong>prjtrvpvault@gmail.com</strong> for help.
      </div>

      {/* Sticky Monochromatic Header */}
      <header className={isMenuOpen ? "menu-open" : ""}>
        <div className="container header-container">
          <a href="#" className="logo">
            <Image
              src="/prj-logo.jpg"
              alt="PRJ Trap Vault logo"
              width={48}
              height={48}
              className="logo-image"
              priority
            />
          </a>

          <button
            className="mobile-nav-toggle"
            type="button"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`mobile-nav ${isMenuOpen ? "open" : ""}`}>
            <ul>
              <li><a href="#" className="active" onClick={() => setIsMenuOpen(false)}>Store</a></li>
              <li><a href="#about" onClick={() => setIsMenuOpen(false)}>About</a></li>
              <li><a href="#contact" onClick={() => setIsMenuOpen(false)}>Support</a></li>
            </ul>
          </nav>

          <div className="header-actions">
            {/* Live authentication button */}
            {user ? (
              <div className="header-user">
                <span className="header-user-email font-sans">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="action-btn header-sign-out font-sans"
                  type="button"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <a href="/auth/login" className="action-btn header-sign-in font-sans">
                Sign In
              </a>
            )}

            {/* Cart Trigger */}
            <button
              className="action-btn"
              onClick={() => {
                setIsMenuOpen(false);
                setIsCartOpen(true);
              }}
              aria-label="Open Shopping Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section
        className="hero"
        style={{ backgroundImage: "url('/images/IMG-20260701-WA0039.jpg')" }}
      >
        <div className="hero-overlay"></div>
        <div className="container" style={{ position: "relative", zIndex: 10 }}>
          <div className="hero-content">
            <span className="hero-tag">Vault Release / 2026</span>
            <h1 className="hero-title">Enter The Monochromatic Vault</h1>
            <p className="hero-subtitle">
              Heavyweight cottons. Custom industrial panels. Curated streetwear for the boldest style minds in Nigeria. Purely black & white.
            </p>
            <a href="#catalog" className="btn btn-primary">Shop The Collection</a>
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
        {products.length === 0 ? (
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
                  setSelectedSize("M");
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

      {/* Mini About Section */}
      <section id="about" className="content-section content-section--bordered">
        <div className="container content-section-inner">
          <h2 className="section-title">PRJ TRAP VAULT Brand Philosophy</h2>
          <p className="section-body">
            Born from a desire to escape normal styling choices, PRJ TRAP VAULT focuses on clean monochromatic contrasts. We avoid high color saturations in favor of deep structural patterns and premium heavy garments. Each piece is engineered in limited quantities to guarantee absolute distinction.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="content-section">
        <div className="container contact-section-inner">
          <div className="section-header">
            <span className="section-eyebrow">Contact the Owners</span>
            <h2 className="section-title">Get in Touch</h2>
            <p className="section-lead">
              For orders, custom requests, or quick support, reach out directly to the PRJ Trap Vault team via email or phone.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <h3>Email</h3>
              <p>
                Send us your questions, order details, or custom drop inquiries.
              </p>
              <a href="mailto:prjtrvpvault@gmail.com" className="contact-link">
                prjtrvpvault@gmail.com
              </a>
            </div>

            <div className="contact-card">
              <h3>Phone</h3>
              <p>
                Prefer to chat? Call or text us for faster order support.
              </p>
              <a href="tel:+2349012270747" className="contact-link">
                09012270747
              </a>
            </div>
          </div>

          <p className="contact-footnote">
            We keep the shop responsive and mobile-friendly, so you can reach us from any device.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="logo">PRJ TRAP VAULT</a>
              <p className="footer-tagline">Premium streetwear designed with raw structures and clean black-and-white silhouettes.</p>
            </div>

            <div className="footer-links">
              <h4>Explore</h4>
              <ul>
                <li><a href="#catalog">Collections</a></li>
                <li><a href="#about">Philosophy</a></li>
                <li><a href="#catalog">Sizing Guide</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <ul>
                <li><a href="#contact">Order Tracking</a></li>
                <li><a href="#contact">Return Policy</a></li>
                <li><a href="#contact">FAQs</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Newsletter</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "12px", lineHeight: "1.4" }}>
                Sign up for notifications on upcoming drops.
              </p>
              <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing!"); }}>
                <input type="email" placeholder="ENTER YOUR EMAIL" className="newsletter-input" required />
                <button type="submit" className="newsletter-btn">Join</button>
              </form>
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
