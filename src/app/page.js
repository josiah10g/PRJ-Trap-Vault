"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {

  return (
    <div className="page-slide-in">

      <main>
        <section
          className="hero"
          style={{ backgroundImage: "url('/images/IMG-20260701-WA0044.jpg')" }}
        >
          <div className="hero-overlay" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="hero-content">
              <span className="hero-tag">PRJ Trap Vault / Streetwear</span>
              <h1 className="hero-title">
                <span className="hero-title-line">Welcome To</span>
                <span className="hero-title-line hero-title-line--wide">PRJ Trap</span>
                <span className="hero-title-line">Vault</span>
              </h1>
              <p className="hero-subtitle">
                PRJ TRAP VAULT is built to sell clean, bold clothing for people who want streetwear with structure, attitude, and a black-and-white identity.
              </p>
              <Link href="/store" className="btn btn-primary hero-cta">Enter The Store</Link>
            </div>
          </div>
        </section>

        <section className="content-section content-section--bordered">
          <div className="container contact-section-inner">
            <div className="section-header">
              <span className="section-eyebrow">What We Do</span>
              <h2 className="section-title">Clothes with a vault mindset</h2>
              <p className="section-lead">
                The website is focused on showcasing and selling PRJ TRAP VAULT clothing: hoodies, tees, pants, shorts, jackets, and future drops. Every page now has one job, so you can learn about the brand, shop the collection, or contact us without confusion.
              </p>
            </div>

            <div className="contact-grid">
              <Link href="/store" className="contact-card nav-card">
                <h3>Shop Clothes</h3>
                <p>View available products, filter the catalog, inspect each item, and add pieces to your cart.</p>
                <span className="contact-link">Go to Store</span>
              </Link>

              <Link href="/about" className="contact-card nav-card">
                <h3>Know the Brand</h3>
                <p>Read more about PRJ TRAP VAULT, the design direction, and the idea behind the vault.</p>
                <span className="contact-link">Read About Us</span>
              </Link>

              <Link href="/contact" className="contact-card nav-card">
                <h3>Reach Us</h3>
                <p>Send an email, call, or message us through WhatsApp for orders and support.</p>
                <span className="contact-link">Contact Us</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

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
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/store">Store</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <ul>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/contact">Order Help</Link></li>
                <li><Link href="/contact">WhatsApp</Link></li>
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
    </div>
  );
}
