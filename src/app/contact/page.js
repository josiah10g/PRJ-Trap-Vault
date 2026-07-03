"use client";

import Link from "next/link";

export default function ContactPage() {
  const phoneNumber = "2349012270747";

  return (
    <>
      <main>
        <section className="content-section content-section--bordered">
          <div className="container contact-section-inner">
            <div className="section-header">
              <span className="section-eyebrow">Contact the Owners</span>
              <h1 className="section-title">Get in Touch</h1>
              <p className="section-lead">
                For orders, custom requests, sizing questions, or quick support, reach out directly to PRJ TRAP VAULT.
              </p>
            </div>

            <div className="contact-grid">
              <div className="contact-card">
                <h3>Email</h3>
                <p>Send your questions, order details, or custom drop inquiries.</p>
                <a href="mailto:prjtrvpvault@gmail.com" className="contact-link">prjtrvpvault@gmail.com</a>
              </div>

              <div className="contact-card">
                <h3>Call or Text</h3>
                <p>Prefer a direct conversation? Call or text us for faster order support.</p>
                <a href="tel:+2349012270747" className="contact-link">09012270747</a>
              </div>

              <div className="contact-card">
                <h3>WhatsApp</h3>
                <p>Message us on WhatsApp for quick product questions and order discussions.</p>
                <a href={`https://wa.me/${phoneNumber}`} className="contact-link" target="_blank" rel="noreferrer">
                  Message on WhatsApp
                </a>
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
              <span><Link href="/about">About Brand</Link></span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
