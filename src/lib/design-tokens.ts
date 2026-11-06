/**
 * Minuto Design Tokens
 * 
 * DESIGN_SYSTEM.md-д тодорхойлсон өнгө, spacing, typography constants.
 * Эдгээрийг компонентуудад шууд ашиглаж болно.
 */

// ========== COLORS ==========
// CSS variables-аас авдаг ч, TypeScript кодод хэрэглэхэд тохиромжтой

export const colors = {
  // Semantic colors (CSS variables-аас)
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  destructive: "var(--destructive)",
  success: "var(--success)",
  warning: "var(--warning)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  
  // Status colors
  status: {
    draft: "var(--muted-foreground)",
    recording: "var(--destructive)",
    paused: "var(--warning)",
    completed: "var(--success)",
    processing: "var(--primary)",
    failed: "var(--destructive)",
  },
} as const;

// ========== SPACING ==========
// 4px increments

export const spacing = {
  0: "0px",
  1: "4px",   // 0.25rem
  2: "8px",   // 0.5rem
  3: "12px",  // 0.75rem
  4: "16px",  // 1rem
  5: "20px",  // 1.25rem
  6: "24px",  // 1.5rem
  8: "32px",  // 2rem
  10: "40px", // 2.5rem
  12: "48px", // 3rem
  16: "64px", // 4rem
} as const;

// ========== TYPOGRAPHY ==========

export const typography = {
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
  },
  
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const;

// ========== BORDER RADIUS ==========

export const borderRadius = {
  none: "0",
  sm: "0.375rem",   // 6px
  md: "0.5rem",     // 8px
  lg: "0.625rem",   // 10px
  xl: "0.75rem",    // 12px
  "2xl": "1rem",    // 16px
  "3xl": "1.5rem",  // 24px
  full: "9999px",
} as const;

// ========== SHADOWS ==========

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
} as const;

// ========== TRANSITIONS ==========

export const transitions = {
  fast: "150ms ease",
  normal: "200ms ease",
  slow: "300ms ease",
} as const;

// ========== BREAKPOINTS ==========

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ========== LAYOUT ==========

export const layout = {
  sidebar: {
    width: "15rem",        // 240px
    collapsedWidth: "4rem", // 64px
  },
  navbar: {
    height: "4rem", // 64px
  },
  container: {
    maxWidth: "80rem", // 1280px
    padding: "1.5rem", // 24px
  },
} as const;
