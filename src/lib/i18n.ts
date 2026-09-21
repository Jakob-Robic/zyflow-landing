import en from "../../locales/en.json";
import sl from "../../locales/sl.json";

export type Locale = "en" | "sl";
export type Messages = typeof en;

const catalogs: Record<Locale, Messages> = { en, sl };

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "sl";
}

export function t(locale: Locale, key: keyof Messages): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? String(key);
}

export function messages(locale: Locale): Messages {
  return catalogs[locale];
}

export function localePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  if (locale === "en") return clean ? `/${clean}` : "/";
  return clean ? `/sl/${clean}` : "/sl";
}

export function alternatePath(locale: Locale, path = ""): string {
  return localePath(locale === "en" ? "sl" : "en", path);
}

export function absoluteUrl(path: string): string {
  const base = "https://www.zyflow.eu";
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
