/**
 * <Scratch> — hand-drawn scratch underline
 *
 * Wraps any inline text with a two-stroke SVG underline that looks like
 * a human ran a pen under the word. Uses `var(--accent)` so it automatically
 * matches the active theme from the ThemeSwitcher.
 *
 * Usage:
 *   import Scratch from "@/app/components/ui/Scratch";
 *
 *   <p>
 *     DataForge delivers <Scratch>enterprise-grade insights</Scratch> in seconds.
 *   </p>
 *
 * Props:
 *   children  — the text / inline nodes to underline
 *   color     — optional override (defaults to var(--accent))
 *   thickness — optional stroke width multiplier (default 1)
 */

import React from "react";

interface ScratchProps {
  children: React.ReactNode;
  /** Override the underline color. Defaults to `var(--accent)`. */
  color?: string;
  /** Multiply the base stroke width (default 1). */
  thickness?: number;
}

export default function Scratch({
  children,
  color = "var(--accent)",
  thickness = 1,
}: ScratchProps) {
  return (
    <span className="relative inline-block pb-1.5">
      {children}
      <svg
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "7px", overflow: "visible" }}
        aria-hidden
      >
        {/* Primary scratch stroke — irregular, hand-drawn feel */}
        <path
          d="M0,6 C3,3 7,8 12,5 C17,2 21,7 27,4 C31,6 36,2 41,5 C47,8 52,3 58,5 C63,2 68,7 74,4 C79,6 84,2 89,5 C93,3 97,6 100,4"
          fill="none"
          stroke={color}
          strokeWidth={2 * thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        {/* Second lighter offset stroke — simulates pen double-pass */}
        <path
          d="M1,8 C5,6 9,9 15,7 C20,5 24,8 30,6 C35,8 40,5 45,7 C50,9 55,6 61,7 C66,5 71,8 77,6 C82,8 87,5 92,7 C96,5 98,7 100,6"
          fill="none"
          stroke={color}
          strokeWidth={1 * thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
        />
      </svg>
    </span>
  );
}
