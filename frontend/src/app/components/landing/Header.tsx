"use client";

import React from "react";
import Link from "next/link";
import ThemeSwitcher from "../ThemeSwitcher";
import Logo from "../Logo";
import { useAuth } from "@/lib/auth";
import UserMenu from "../UserMenu";

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  return (
    <>
      <header className="px-5 md:px-8 py-4 flex justify-between items-center border-b sticky top-0 z-50 backdrop-blur-md" style={{ background: "var(--nav)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/about" className="text-[11px] font-bold transition-colors hover:text-[var(--accent)]" style={{ color: "var(--txt-m)", textDecoration: "none" }}>
            About Us
          </Link>
          <ThemeSwitcher />
          {!authLoading && isLoggedIn ? (
            <UserMenu />
          ) : (
            <button onClick={onLoginClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all hover:border-[var(--accent)]" style={{ borderColor: "var(--border)", color: "var(--txt-m)" }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </button>
          )}
        </div>
      </header>

    </>
  );
}
