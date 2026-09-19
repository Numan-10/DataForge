import React, { useEffect } from "react";

export default function FAQ() {
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

  return (
    <section className="section py-24">
      <div className="max-w-6xl mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Side: Header */}
        <div className="md:col-span-5 lg:col-span-5 flex flex-col gap-2 reveal">
          <p className="section-eyebrow mb-1">Questions</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--txt)" }}>Before you upload.</h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--txt-m)" }}>
            Everything you need to know about how DataForge handles your files, security, and technical requirements.
          </p>
        </div>
        
        {/* Right Side: Accordions */}
        <div className="md:col-span-7 lg:col-span-7 space-y-3 reveal">
          <details className="gc faq-item rounded-xl px-5 py-4 group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-sm font-bold transition-colors group-hover:text-[var(--accent)]" style={{ color: "var(--txt)" }}>Where does my data go?</span>
              <svg className="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--txt-m)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--txt-m)" }}>
              Your file is processed for the session and never shared externally. Sign-in is required only so you can resume a project later.
            </p>
          </details>
          <details className="gc faq-item rounded-xl px-5 py-4 group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-sm font-bold transition-colors group-hover:text-[var(--accent)]" style={{ color: "var(--txt)" }}>What file formats are supported?</span>
              <svg className="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--txt-m)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--txt-m)" }}>
              CSV up to 200MB, or a Google Sheet shared as &quot;Anyone with the link can view.&quot;
            </p>
          </details>
          <details className="gc faq-item rounded-xl px-5 py-4 group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-sm font-bold transition-colors group-hover:text-[var(--accent)]" style={{ color: "var(--txt)" }}>Do I need to know Python or SQL?</span>
              <svg className="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--txt-m)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--txt-m)" }}>
              No. Cleaning, EDA, and modelling run automatically. The AI Query tab lets you ask follow-up questions in plain English.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
