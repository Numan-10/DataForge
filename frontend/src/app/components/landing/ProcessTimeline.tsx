"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const STEPS = [
  { title: "Ingest",  num: "01", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> },
  { title: "Clean",   num: "02", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /> },
  { title: "Analyse", num: "03", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> },
  { title: "Ask AI",  num: "04", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /> },
  { title: "Model",   num: "05", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /> },
  { title: "Report",  num: "06", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> },
];

export default function ProcessTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "end 45%"]
  });
  
  const widthProgress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const heightProgress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // 0 to 1 across 6 steps
    const index = Math.min(5, Math.floor(latest * 5.99));
    setActiveIndex(index);
  });

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 w-full mt-24 mb-10 pb-6 text-center md:text-left">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-12 md:mb-20" style={{ color: "var(--txt-m)" }}>
        What happens after you upload
      </p>

      <div ref={containerRef} className="relative flex flex-col md:flex-row items-center justify-between w-full px-2 gap-y-12 md:gap-y-0">
        {/* Background line */}
        <div className="absolute top-0 md:top-[27px] left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-[2px] md:w-full h-full md:h-[4px] rounded-full" style={{ background: "var(--border)", zIndex: 0 }}></div>

        {/* Active line gradient (Mobile) */}
        <motion.div 
          className="md:hidden absolute top-0 left-1/2 -translate-x-1/2 w-[2px] rounded-full" 
          style={{ zIndex: 1, background: "var(--accent)", boxShadow: "0 0 10px var(--glow)", height: heightProgress }}
        />
        
        {/* Active line gradient (Desktop) */}
        <motion.div 
          className="hidden md:block absolute top-[27px] left-0 h-[4px] rounded-full" 
          style={{ zIndex: 1, background: "var(--accent)", boxShadow: "0 0 10px var(--glow)", width: widthProgress }}
        />

        {STEPS.map((step, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          
          const borderColor = (isDone || isActive) ? "var(--accent)" : "var(--border)";
          const outerBg = (isDone || isActive) ? "var(--bg)" : "var(--surface)";
          const shadow = (isDone || isActive) ? "0 0 15px var(--glow)" : "none";
          const innerBg = isDone ? "var(--glow)" : (isActive ? "var(--surface)" : "transparent");
          const iconColor = isDone ? "var(--accent)" : (isActive ? "var(--accent)" : "var(--txt-m)");
          const titleColor = (isDone || isActive) ? "var(--txt)" : "var(--txt-m)";
          const numColor = (isDone || isActive) ? "var(--accent)" : "var(--txt-m)";

          return (
            <div key={i} className="relative z-10 flex flex-col items-center group cursor-default transition-opacity duration-300 w-full md:w-auto">
              <div className="relative flex-shrink-0">
                {isActive && (
                  <div className="absolute inset-0 rounded-full border-[2px] animate-ping opacity-30" style={{ borderColor: "var(--accent)" }}></div>
                )}
                <div 
                  className="w-16 h-16 md:w-14 md:h-14 rounded-full border-[2px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 relative shadow-sm" 
                  style={{ borderColor, background: outerBg, boxShadow: shadow }}
                >
                  <div 
                    className="w-14 h-14 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors duration-300" 
                    style={{ background: innerBg }}
                  >
                    <svg 
                      className="w-8 h-8 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-110" 
                      style={{ color: iconColor }} 
                      fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    >
                      {step.icon}
                    </svg>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:absolute md:top-20 min-w-max text-center transition-all duration-300 group-hover:translate-y-1 bg-[var(--bg)] md:bg-transparent px-4 md:px-0 py-2 md:py-0 rounded-lg">
                <p className="text-[18px] md:text-[16px] font-black tracking-wide transition-colors duration-300" style={{ color: titleColor }}>{step.title}</p>
                <p className="text-[14px] md:text-[12px] mt-1 font-mono font-bold transition-colors duration-300" style={{ color: numColor }}>{step.num}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden md:block h-20 w-full"></div> {/* Spacer for the absolute text */}
    </div>
  );
}
