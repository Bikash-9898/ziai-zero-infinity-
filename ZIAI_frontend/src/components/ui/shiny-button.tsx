// src/components/ui/shiny-button.tsx
//
// "use client" is a no-op in Vite, but is kept so this file stays portable if
// the app is ever migrated to Next.js.
"use client";

import type React from "react";

import { cn } from "@/lib/utils";
// styled-jsx is Next.js-only and unsupported by Vite — the animation lives in
// this colocated stylesheet instead. See shiny-button.css for the port notes.
import "./shiny-button.css";

interface ShinyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /**
   * Defaults to "button" so the CTA never submits an ancestor <form> by
   * accident — a plain <button> inside a form defaults to type="submit".
   */
  type?: "button" | "submit" | "reset";
  /** Renders the flat, animation-free state (e.g. the "current plan" card). */
  disabled?: boolean;
  highlightColor?: string;
  "aria-label"?: string;
  "aria-busy"?: boolean;
}

export function ShinyButton({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
  highlightColor,
  ...rest
}: ShinyButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn("shiny-cta", className)}
      style={highlightColor ? { "--shiny-cta-highlight": highlightColor } as React.CSSProperties : undefined}
      onClick={onClick}
      {...rest}
    >
      <span>{children}</span>
    </button>
  );
}
