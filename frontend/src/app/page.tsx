"use client";

import React, { useState, useEffect } from "react";
import LoginModal from "./components/landing/LoginModal";
import Header from "./components/landing/Header";
import HeroSection from "./components/landing/HeroSection";
import FeatureGrid from "./components/landing/FeatureGrid";
import StatsStrip from "./components/landing/StatsStrip";
import BuiltFor from "./components/landing/BuiltFor";
import FAQ from "./components/landing/FAQ";
import CTABanner from "./components/landing/CTABanner";
import Footer from "./components/landing/Footer";
import ProcessTimeline from "./components/landing/ProcessTimeline";
import TeamSection from "./components/landing/TeamSection";

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [uploadAlert, setUploadAlert] = useState(false);

  useEffect(() => {
    // Check query string for login modal
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get('login') === '1') {
        setShowLoginModal(true);
        window.history.replaceState({}, '', '/');
      }
      if (params.get('upload_required') === '1') {
        setUploadAlert(true);
        window.history.replaceState({}, '', '/');
        setTimeout(() => setUploadAlert(false), 5000);
      }
    }
  }, []);

  return (
    <>
      <div className="noise"></div>
      <div className="mesh"></div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {uploadAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl" style={{ background: "var(--surface)", border: "1px solid rgba(245,158,11,0.3)", animation: "slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/10">
            <svg width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-sm font-bold tracking-wide" style={{ color: "var(--txt)" }}>Please upload a file first to access the workspace.</p>
          <button onClick={() => setUploadAlert(false)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity"><svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" /></svg></button>
        </div>
      )}

      <Header onLoginClick={() => setShowLoginModal(true)} />

      <main className="flex-grow flex flex-col items-center justify-center py-4 md:py-6 w-full max-w-7xl mx-auto">
        <HeroSection onLoginRequired={() => setShowLoginModal(true)} />
      </main>

      <ProcessTimeline />

      <FeatureGrid />

      <StatsStrip />

      <BuiltFor />

      <CTABanner />

      <TeamSection />

      <FAQ />

      <Footer />
    </>
  );
}
