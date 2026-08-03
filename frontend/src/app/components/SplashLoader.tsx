"use client";

import React, { useState, useEffect, useRef } from "react";
import Logo from "./Logo";

interface SplashLoaderProps {
  isLoading: boolean;
  onComplete?: () => void;
}

export default function SplashLoader({ isLoading, onComplete }: SplashLoaderProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - mountTime.current;
      const delay = Math.max(0, 2000 - elapsed); // Ensure at least 2 seconds

      const startFadeOut = setTimeout(() => {
        setIsFadingOut(true);
        
        const removeTimeout = setTimeout(() => {
          setShouldRender(false);
          if (onComplete) {
            onComplete();
          }
        }, 500); // 500ms fade-out transition
      }, delay);
      
      return () => clearTimeout(startFadeOut);
    }
  }, [isLoading, onComplete]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: "var(--bg)" }}
    >
      <div 
        className="flex items-center justify-center opacity-80"
        style={{ animation: "twinkle 2.5s ease-in-out infinite" }}
      >
        <Logo size={42} textSize={24} />
      </div>
    </div>
  );
}
