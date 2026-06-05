import { Profile } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatMoney(amount: number, currency = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}${symbol}${formatted}`;
}

export function displayName(p?: Profile | null, fallback = "Someone"): string {
  if (!p) return fallback;
  return p.full_name || p.email?.split("@")[0] || fallback;
}

export function initials(p?: Profile | null): string {
  const name = p?.full_name || p?.email || "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

// Deterministic pleasant color for an avatar based on a string id.
export function colorFromId(id: string): string {
  const palette = [
    "#1CC29F", "#FF652F", "#5B8DEF", "#9B5DE5",
    "#F15BB5", "#00BBF9", "#F4A259", "#43AA8B",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
