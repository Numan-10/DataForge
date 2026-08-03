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
import SplashLoader from "./components/SplashLoader";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [uploadAlert, setUploadAlert] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const { loading } = useAuth();

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
      if (params.get('login_success') === '1') {
        setShowSplash(true);
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  return (
    <>
      <div className="noise"></div>
      <div className="mesh"></div>

      {showSplash && <SplashLoader isLoading={loading} onComplete={() => setShowSplash(false)} />}

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {uploadAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-fit max-w-[90vw] z-[9999] px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-xl backdrop-blur-md" style={{ background: "rgba(15, 10, 5, 0.9)", border: "1px solid rgba(245,158,11,0.3)", animation: "slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)" }}>
          <span className="text-amber-500 text-sm md:text-base leading-none">⚠️</span>
          <p className="text-xs md:text-sm font-medium tracking-wide" style={{ color: "var(--txt)" }}>Please upload a file first to access the workspace.</p>
          <button onClick={() => setUploadAlert(false)} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 ml-1 p-0.5" style={{ color: "var(--txt-m)" }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" /></svg>
          </button>
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
