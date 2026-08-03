"use client";

import React, { useState, useEffect } from "react";

interface SplashLoaderProps {
  isLoading: boolean;
  onComplete?: () => void;
}

export default function SplashLoader({ isLoading, onComplete }: SplashLoaderProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Start fade out transition
      setIsFadingOut(true);
      
      const timeout = setTimeout(() => {
        setShouldRender(false);
        if (onComplete) {
          onComplete();
        }
      }, 500); // 500ms allows the CSS transition to complete smoothly
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, onComplete]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Antigravity / DataForge Twinkling Text */}
        <h1 
          className="text-4xl md:text-5xl font-black tracking-tighter"
          style={{ 
            color: "var(--txt)",
            animation: "twinkle 2s ease-in-out infinite"
          }}
        >
          DataForge
        </h1>
        
        {/* Subtle accent line underneath */}
        <div 
          className="w-16 h-1 rounded-full opacity-50"
          style={{ 
            background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
            animation: "pulseWidth 2s ease-in-out infinite"
          }}
        />
      </div>
    </div>
  );
}
