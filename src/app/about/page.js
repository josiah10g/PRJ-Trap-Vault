"use client";

import Link from "next/link";

export default function AboutPage() {

  return (
    <>


      <main>
        <section className="content-section content-section--bordered page-intro">
          <div className="container content-section-inner">
            <span className="section-eyebrow">About PRJ Trap Vault</span>
            <h1 className="section-title">Built for clean streetwear energy</h1>
            <p className="section-body">
              PRJ TRAP VAULT was created for people who want clothes that feel sharp, confident, and easy to style. The brand leans into black-and-white visuals, heavyweight materials, oversized cuts, and structured details that stand out without needing loud colors.
            </p>
          </div>
        </section>

        <section className="content-section">
          <div className="container contact-section-inner">
            <div className="contact-grid">
              <div className="contact-card">
                <h3>Our Style</h3>
                <p>Minimal colors, strong shapes, relaxed fits, and clothing that works for daily wear, shoots, events, and street looks.</p>
              </div>

              <div className="contact-card">
                <h3>Our Aim</h3>
                <p>To make it simple for customers to discover PRJ pieces, understand each item, and order from anywhere on mobile or desktop.</p>
              </div>

              <div className="contact-card">
                <h3>Our Drops</h3>
                <p>Every collection is arranged around practical pieces like tees, hoodies, cargos, shorts, jackets, and future limited releases.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footer-bottom" style={{ marginTop: 0 }}>
            <p className="copyright">&copy; 2026 PRJ TRAP VAULT. All rights reserved.</p>
            <div className="payment-methods">
              <span><Link href="/store">Visit Store</Link></span>
              <span><Link href="/contact">Contact Us</Link></span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
