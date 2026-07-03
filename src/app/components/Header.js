"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import UserProfile from "./UserProfile";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const isUserLoggedIn = () => {
      if (typeof window === "undefined") return false;
      return Object.keys(localStorage).some(key => key.startsWith("sb-"));
    };

    const checkInactiveTime = () => {
      if (!isUserLoggedIn()) return;
      const lastHiddenStr = localStorage.getItem("trap_vault_last_hidden_time");
      if (lastHiddenStr) {
        const lastHidden = Number(lastHiddenStr);
        const timePassed = Date.now() - lastHidden;
        if (timePassed > 120000) { // 2 minutes
          localStorage.removeItem("trap_vault_last_hidden_time");
          // Clear session
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith("sb-")) {
              localStorage.removeItem(key);
            }
          });
          document.cookie.split(";").forEach(c => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
            if (name.includes("sb-") || name.includes("supabase")) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;domain=${window.location.hostname};`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });
          window.location.href = "/";
        }
      }
    };

    checkInactiveTime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (isUserLoggedIn()) {
          localStorage.setItem("trap_vault_last_hidden_time", Date.now().toString());
        }
      } else if (document.visibilityState === "visible") {
        checkInactiveTime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Don't render the header on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <header className={isMenuOpen ? "menu-open" : ""}>
      <div className="container header-container">
        <Link href="/" className="logo">
          <Image
            src="/prj-logo.jpg"
            alt="PRJ Trap Vault logo"
            width={48}
            height={48}
            className="logo-image"
            priority
          />
        </Link>

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
            <li>
              <Link href="/" className={pathname === "/" ? "active" : ""} onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className={pathname === "/about" ? "active" : ""} onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
            </li>
            <li>
              <Link href="/store" className={pathname === "/store" ? "active" : ""} onClick={() => setIsMenuOpen(false)}>
                Store
              </Link>
            </li>
            <li>
              <Link href="/contact" className={pathname === "/contact" ? "active" : ""} onClick={() => setIsMenuOpen(false)}>
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
