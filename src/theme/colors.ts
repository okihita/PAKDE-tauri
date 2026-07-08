/** PAKDE Brand Color Scheme
 *
 *  Primary brand palette:
 *    Lime green  #A2C11C   — brand, success, primary actions
 *    Teal        #055469   — backgrounds, surfaces, sidebars
 *    Light gold  #E4A613   — warnings, accents, badges
 *
 *  Each color is defined as HSL components for use in CSS variables.
 */

export const COLORS = {
  /** Lime green — primary brand color for CTAs, active states, health bars */
  brand: { hex: "#A2C11C", h: 75, s: 76, l: 43 },
  /** Teal — dark background, sidebars, card surfaces */
  teal: { hex: "#055469", h: 197, s: 91, l: 22 },
  /** Light gold — warning states, demo mode, achievements */
  gold: { hex: "#E4A613", h: 42, s: 85, l: 48 },
} as const;

/** HSL string for use in CSS `hsl(h s% l%)` */
export function hsl(h: number, s: number, l: number) {
  return `${h} ${s}% ${l}%` as const;
}

/** CSS variable assignments for the dark theme */
export const DARK_THEME = {
  "--brand": hsl(COLORS.brand.h, COLORS.brand.s, COLORS.brand.l),
  "--brand-foreground": "0 0% 0%",
  "--success": hsl(COLORS.brand.h, COLORS.brand.s, COLORS.brand.l + 8),
  "--success-foreground": "0 0% 0%",
  "--warning": hsl(COLORS.gold.h, COLORS.gold.s, COLORS.gold.l),
  "--warning-foreground": "0 0% 0%",
  "--danger": "350 89% 60%",
  "--danger-foreground": "210 40% 98%",
  "--info": hsl(COLORS.teal.h, COLORS.teal.s, COLORS.teal.l),
  "--info-foreground": "210 40% 98%",
} satisfies Record<string, string>;
