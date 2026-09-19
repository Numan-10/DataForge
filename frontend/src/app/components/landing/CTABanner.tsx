"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface CTABannerProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  buttonText?: string;
  href?: string;
  bgColor?: string;
  btnTextColor?: string;
}

export default function CTABanner({ title, subtitle, buttonText, href, bgColor, btnTextColor }: CTABannerProps) {
  useEffect(() => {
    const items = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollToTop = () => {
    if (!href) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const defaultTitle = (
    <>Bring your own dataset.<br className="hidden sm:block md:hidden lg:block" /> <span className="sm:hidden md:inline lg:hidden"> </span>See it forged in minutes.</>
  );

  const buttonContent = (
    <button onClick={scrollToTop} className="btn-mag w-full md:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold tracking-tight flex-shrink-0" style={{ background: "#fff", color: btnTextColor || "#7A1F09", minWidth: "160px" }}>
      {buttonText || "Upload a dataset"}
    </button>
  );

  return (
    <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "4rem 0" }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="reveal px-6 py-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6 text-center md:text-left" style={{ background: bgColor || "#FF4310", borderRadius: "1.25rem" }}>
          <div>
            <h2 className="text-[26px] leading-[1.1] md:text-3xl font-black tracking-tight" style={{ color: "#fff" }}>
              {title || defaultTitle}
            </h2>
            <p className="text-[15px] mt-4 md:mt-3" style={{ color: "rgba(255,255,255,0.75)" }}>
              {subtitle || "No setup, no credit card, no code."}
            </p>
          </div>
          {href ? (
            <Link href={href} className="w-full md:w-auto block">
              {buttonContent}
            </Link>
          ) : (
            buttonContent
          )}
        </div>
      </div>
    </section>
  );
}
