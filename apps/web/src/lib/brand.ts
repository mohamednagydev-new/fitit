/**
 * FIT IT brand constants. Values come from apps/web/.env (committed — brand
 * identity, not secrets); the fallbacks here mean even an env-less build is
 * still FIT IT. App code imports names/origins from here — never hardcode.
 */
export const BRAND = (import.meta.env.VITE_BRAND as string) || 'fitit';
export const BRAND_NAME = (import.meta.env.VITE_BRAND_NAME as string) || 'FIT IT';
/** English-only brand: i18n is pinned to English, no language toggle. */
export const BRAND_LANG = (import.meta.env.VITE_BRAND_LANG as string) || 'en';
export const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN as string) || 'https://fitit.geddo.online';
export const ENGLISH_ONLY = BRAND_LANG === 'en';
