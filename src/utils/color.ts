/**
 * WCAG contrast helpers.
 *
 * The app picks a different accent color per calculator (pink, teal,
 * cyan, sky blue, brown) and puts white text on top of it for buttons,
 * badges and pills. White-on-accent only meets the AA text-contrast
 * minimum (4.5:1) for some of those colors — on the brighter ones
 * (pink #ec4899, cyan #06b6d4, sky blue #0ea5e9) plain white text drops
 * to roughly 2.4–3.7:1, which fails.
 *
 * `onAccent()` measures the accent's relative luminance and returns
 * whichever of near-black / white passes AA (falling back to whichever
 * contrasts more if a color is so mid-toned neither reaches 4.5:1).
 * Use it anywhere an accent color is used as a solid background with
 * text or an icon on top.
 */

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

const NEAR_BLACK = '#14101a';
const WHITE = '#ffffff';

/** Best-contrast text color (white or near-black) to place on top of `bgHex`. */
export function onAccent(bgHex: string): string {
  const white = contrastRatio(WHITE, bgHex);
  const black = contrastRatio(NEAR_BLACK, bgHex);
  return black > white ? NEAR_BLACK : WHITE;
}

/* ── Theme-aware accent ────────────────────────────────────────────────
 * The brand accents (pink, teal, sky, brown, cyan) were picked for the
 * dark theme. Used as TEXT or icon color on the light theme's white /
 * pale-grey surfaces several of them drop to 2.2–3.4:1, which both
 * fails WCAG AA and looks washed out. `accentInk()` returns the accent
 * unchanged in dark mode, and in light mode blends it toward black just
 * far enough to reach 4.6:1 against the light background, keeping the
 * hue so each app still feels like its own color.
 */
const LIGHT_BG = '#f3f5f9';

function mixWithBlack(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const ch = [0, 2, 4].map(i => Math.round(parseInt(h.substring(i, i + 2), 16) * (1 - amount)));
  return '#' + ch.map(c => c.toString(16).padStart(2, '0')).join('');
}

export function accentInk(hex: string, isDark: boolean): string {
  if (isDark) return hex;
  let out = hex;
  for (let amount = 0; amount <= 0.7 && contrastRatio(out, LIGHT_BG) < 4.6; amount += 0.04) {
    out = mixWithBlack(hex, amount);
  }
  return out;
}
