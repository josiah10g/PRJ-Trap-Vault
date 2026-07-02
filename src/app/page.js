"use client";

import React, { useState, useEffect } from "react";
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
    name: "PRG Premium Oversized Tee",
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
    name: "PRG Heavyweight Fleece Hoodie",
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
  const [products, setProducts] = useState(PRODUCTS);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [user, setUser] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState("");

  // Load Supabase session on mount
  useEffect(() => {
    const supabase = createClient();
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
    await supabase.auth.signOut();
    setUser(null);
  };

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("trap_vault_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
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

  // Filter products based on search and category
  useEffect(() => {
    let filtered = PRODUCTS;
    if (activeCategory !== "all") {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setProducts(filtered);
  }, [activeCategory, searchQuery]);

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

  // Live Paystack checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) {
      alert("Paystack is not configured yet. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your environment variables.");
      return;
    }

    const email = user?.email;
    if (!email) {
      window.location.href = "/auth/login";
      return;
    }

    const total = getSubtotal(); // in Naira

    setCheckoutLoading(true);
    setCheckoutMsg("");

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email,
      amount: total * 100, // Paystack expects kobo
      currency: "NGN",
      ref: `PRG-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      metadata: {
        custom_fields: [
          { display_name: "Store", variable_name: "store", value: "PRG TRAP VAULT" },
        ],
      },
      onClose: () => {
        setCheckoutLoading(false);
        setCheckoutMsg("Payment cancelled.");
      },
      callback: async (response) => {
        // Server-side verification
        try {
          const res = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              cartItems: cart,
              userEmail: email,
            }),
          });
          const data = await res.json();
          if (data.success) {
            saveCart([]);
            setIsCartOpen(false);
            setCheckoutMsg("");
            setCheckoutLoading(false);
            alert(`✅ Order confirmed! Payment of ${formatNaira(data.amount)} received. Check your email for details.`);
          } else {
            setCheckoutLoading(false);
            setCheckoutMsg(`Payment error: ${data.error}`);
          }
        } catch {
          setCheckoutLoading(false);
          setCheckoutMsg("Could not verify payment. Please contact support.");
        }
      },
    });

    handler.openIframe();
  };

  return (
    <>
      {/* Sticky Monochromatic Header */}
      <header>
        <div className="container header-container">
          <a href="#" className="logo">
            PRG TRAP VAULT <span>NG</span>
          </a>
          
          <nav>
            <ul>
              <li><a href="#" className="active">Store</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Support</a></li>
            </ul>
          </nav>

          <div className="header-actions">
            {/* Live authentication button */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="font-sans" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="action-btn font-sans"
                  style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", background: "none", border: "none", color: "inherit" }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <a href="/auth/login" className="action-btn font-sans" style={{ fontSize: "0.85rem", textTransform: "uppercase", textDecoration: "none", color: "inherit" }}>
                Sign In
              </a>
            )}
            
            {/* Cart Trigger */}
            <button 
              className="action-btn" 
              onClick={() => setIsCartOpen(true)}
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
          <div style={{ padding: "80px 0", textAlignment: "center", color: "var(--text-secondary)", fontFamily: "var(--font-sans-family)", textTransform: "uppercase" }}>
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
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
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
                <img src={item.image} alt={item.name} className="cart-item-image" />
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
              disabled={checkoutLoading}
              style={{ opacity: checkoutLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            >
              {checkoutLoading ? (
                <>
                  <span className="auth-spinner" style={{ borderTopColor: "#000" }} />
                  Processing…
                </>
              ) : (
                "Proceed to Payment"
              )}
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
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
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
      <section id="about" style={{ padding: "80px 0", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
        <div className="container" style={{ maxWidth: "800px", textAlignment: "center", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "24px" }}>PRG TRAP VAULT Brand Philosophy</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.8", fontSize: "1.05rem" }}>
            Born from a desire to escape normal styling choices, PRG TRAP VAULT focuses on clean monochromatic contrasts. We avoid high color saturations in favor of deep structural patterns and premium heavy garments. Each piece is engineered in limited quantities to guarantee absolute distinction.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="logo">PRG TRAP VAULT</a>
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
            <p className="copyright">&copy; 2026 PRG TRAP VAULT. All rights reserved.</p>
            <div className="payment-methods">
              <span>PAYSTACK SECURE Checkout</span>
              <span>&bull;</span>
              <span>CARDS</span>
              <span>&bull;</span>
              <span>TRANSFERS</span>
              <span>&bull;</span>
              <span>USSD</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
