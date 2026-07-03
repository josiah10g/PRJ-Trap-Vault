"use client";

import Link from "next/link";
import Image from "next/image";
import UserProfile from "./UserProfile";

export default function Navbar() {
    return (
        <header className="global-navbar">
            <div className="container header-container">
                <Link href="/" className="logo">
                    <Image
                        src="/prj-logo.jpg"
                        alt="PRJ Trap Vault logo"
                        width={40}
                        height={40}
                        className="logo-image"
                        priority
                    />
                    <span className="logo-text">PRJ TRAP VAULT</span>
                </Link>
                <div style={{ flex: 1 }} />
                <div className="header-actions">
                    <UserProfile />
                </div>
            </div>
        </header>
    );
}
