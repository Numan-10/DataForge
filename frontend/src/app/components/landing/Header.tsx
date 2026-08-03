"use client";

import React from "react";
import Link from "next/link";
import ThemeSwitcher from "../ThemeSwitcher";
import Logo from "../Logo";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isLoggedIn = !!user;
  const [toast, setToast] = React.useState<string | null>(null);

  const handleWorkspaceClick = (e: React.MouseEvent) => {
    if (!localStorage.getItem('df_last_upload')) {
      e.preventDefault();
      setToast("Please upload a dataset first to access the workspace!");
      setTimeout(() => setToast(null), 3500);
    }
  };

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
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full border transition-all hover:border-[var(--accent)]"
                style={{ borderColor: "var(--border)" }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: "var(--accent)", color: "#fff" }}>
                    {(user?.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <svg className="w-3.5 h-3.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <Link href="/dashboard" className="flex items-center px-4 py-2.5 text-[12px] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--txt)", textDecoration: "none" }} onClick={() => setIsMenuOpen(false)}>
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      Dashboard
                    </Link>
                    <Link href="/workspace" className="flex items-center px-4 py-2.5 text-[12px] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--txt)", textDecoration: "none" }} onClick={(e) => { handleWorkspaceClick(e); setIsMenuOpen(false); }}>
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      Workspace
                    </Link>
                    <button onClick={() => { setIsMenuOpen(false); logout(); }} className="w-full flex items-center px-4 py-2.5 text-[12px] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left text-red-500">
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
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

      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--txt)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,.15)" }}>
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p className="text-[13px] font-bold tracking-tight">Access Denied</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--txt-m)" }}>{toast}</p>
          </div>
        </div>
      )}
    </>
  );
}
