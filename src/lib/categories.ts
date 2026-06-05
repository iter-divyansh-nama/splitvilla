// Shared expense categories used by the add-expense form and feed rows.

export interface Category {
  key: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { key: "general", label: "General", emoji: "🧾" },
  { key: "food", label: "Food & drink", emoji: "🍽️" },
  { key: "groceries", label: "Groceries", emoji: "🛒" },
  { key: "transport", label: "Transport", emoji: "🚕" },
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "rent", label: "Rent", emoji: "🏠" },
  { key: "utilities", label: "Utilities", emoji: "💡" },
  { key: "entertainment", label: "Fun", emoji: "🎬" },
  { key: "shopping", label: "Shopping", emoji: "🛍️" },
  { key: "health", label: "Health", emoji: "💊" },
];

export function categoryEmoji(category: string): string {
  return CATEGORIES.find((c) => c.key === category)?.emoji ?? "🧾";
}
