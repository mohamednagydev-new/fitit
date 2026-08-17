/** Brand palettes. vite.config.ts stamps process.env.VITE_BRAND from the build
 *  mode (.env / .env.fitit) before postcss loads this file — same repo, two
 *  looks. PULSE = energetic orange; FIT IT = the logo's gold on black, so the
 *  warm scales (orange/pink) become golds and `rose` (header gradients)
 *  becomes graphite. */
const FITIT = (process.env.VITE_BRAND ?? 'fitit') !== 'pulse';

const brandColors = FITIT
  ? {
      brand: {
        // Gold-600 as the primary: bright logo-yellow (#FACC15) fails white
        // text, so it stays the ACCENT while this carries buttons and labels.
        pink: '#CA8A04',
        orange: '#CA8A04',
        blue: '#2563EB',
        green: '#16A34A',
        teal: '#0D9488',
        red: '#E11D48',
        yellow: '#FACC15',
      },
      pink: { 100: '#FEF9C3', 300: '#FDE047', 400: '#FACC15', 500: '#CA8A04', 600: '#A16207', 700: '#854D0E' },
      // Every from-orange-*/to-orange-* gradient turns gold automatically.
      orange: { 100: '#FEF9C3', 200: '#FEF08A', 300: '#FDE047', 400: '#FACC15', 500: '#EAB308', 600: '#CA8A04', 700: '#A16207' },
      // rose carries the hero-header gradients — graphite makes them the
      // black half of the black/gold identity.
      rose: { 100: '#F4F4F5', 300: '#A1A1AA', 400: '#71717A', 500: '#3F3F46', 600: '#27272A', 700: '#18181B', 800: '#111113', 900: '#0B0B0D' },
      ink: '#161513',
    }
  : {
      // `brand.pink` keeps its key (used across the app) but is now the energetic
      // orange primary — a unisex, motivational "energy" color.
      brand: {
        pink: '#F97316',
        // Alias of brand.pink: the primary IS orange, and five call sites
        // already wrote `brand-orange` assuming this existed (they silently
        // rendered colorless until it did).
        orange: '#F97316',
        blue: '#2563EB',
        green: '#16A34A',
        teal: '#0D9488',
        red: '#E11D48',
        yellow: '#F59E0B',
      },
      // Remap the whole `pink` scale (used in gradients like from-brand-pink to-pink-500).
      pink: {
        100: '#FFEDD5',
        300: '#FDBA74',
        400: '#FB923C',
        500: '#F97316',
        600: '#EA580C',
        700: '#C2410C',
      },
      ink: '#161513',
    };

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Class-based dark mode: `dark:` variants now work alongside the legacy
  // .dark overrides in index.css (theme.ts stamps .dark on <html>).
  darkMode: 'class',
  theme: {
    extend: {
      colors: brandColors,
      fontFamily: {
        sans: ['Nunito', 'Tajawal', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['Tajawal', 'Nunito', 'sans-serif'],
        // Fraunces carries the big numerals (stats, counters, timers) — a serif
        // display voice that makes numbers feel like achievements, not data.
        // Tajawal fallback keeps Arabic-adjacent glyphs consistent.
        display: ['Fraunces', 'Tajawal', 'serif'],
      },
      // User feedback: small text hurt to read. The small end of the scale is
      // lifted (xs 12→14.4px, sm 14→16.2px at the 18px root) so every screen's
      // body/secondary text grows without inflating spacing any further.
      fontSize: {
        xs: ['0.8rem', { lineHeight: '1.15rem' }],
        sm: ['0.9rem', { lineHeight: '1.3rem' }],
      },
    },
  },
  plugins: [],
};
