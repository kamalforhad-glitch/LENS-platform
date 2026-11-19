import {
  BarChart3,
  Database,
  FileText,
  Globe,
  Lock,
  Megaphone,
  Newspaper,
  Search,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement, type ReactElement } from "react";

export const FOCUS_ICON_OPTIONS = [
  { value: "BarChart3", label: "Research", icon: BarChart3 },
  { value: "Users", label: "People", icon: Users },
  { value: "Megaphone", label: "Campaign", icon: Megaphone },
  { value: "FileText", label: "Policy", icon: FileText },
  { value: "Database", label: "Index", icon: Database },
  { value: "Shield", label: "Freedom", icon: Shield },
  { value: "Newspaper", label: "Press", icon: Newspaper },
  { value: "Lock", label: "Security", icon: Lock },
  { value: "Search", label: "Insights", icon: Search },
  { value: "Globe", label: "Network", icon: Globe },
  { value: "Sparkles", label: "General", icon: Sparkles },
] as const;

export type FocusIconValue = (typeof FOCUS_ICON_OPTIONS)[number]["value"];

const ICON_MAP: Readonly<Record<string, LucideIcon>> = Object.fromEntries(
  FOCUS_ICON_OPTIONS.map((option) => [option.value, option.icon])
);

const FALLBACK_ICONS: readonly FocusIconValue[] = [
  "BarChart3",
  "Users",
  "Megaphone",
  "FileText",
  "Database",
  "Shield",
  "Lock",
  "Lock",
];

export function resolveFocusIcon(
  value: string | null | undefined,
  order = 0
): LucideIcon {
  const normalized = value?.trim();
  if (normalized && ICON_MAP[normalized]) return ICON_MAP[normalized];

  // Legacy aliases use lowercase/dashed names from the old i18n keys.
  const aliasMap: Readonly<Record<string, FocusIconValue>> = {
    bar_chart_3: "BarChart3",
    chart: "BarChart3",
    users: "Users",
    megaphone: "Megaphone",
    file_text: "FileText",
    database: "Database",
    shield: "Shield",
    lock: "Lock",
  };
  const alias = normalized ? aliasMap[normalized.toLowerCase().replace(/[\s-]+/g, "_")] : undefined;
  if (alias) return ICON_MAP[alias];

  const index = Number.isFinite(order) ? Math.abs(Math.trunc(order)) % FALLBACK_ICONS.length : 0;
  return ICON_MAP[FALLBACK_ICONS[index]];
}

/**
 * Renders the resolved icon as an element rather than returning a component
 * type from inside a React render. This keeps the ESLint
 * `react-hooks/static-components` rule satisfied while preserving the same
 * allow-listed icon set.
 */
export function renderFocusIcon(
  value: string | null | undefined,
  order = 0,
  props: LucideProps = {}
): ReactElement {
  return createElement(resolveFocusIcon(value, order), props);
}

const ACCENTS = [
  { accent: "#3b82f6", glow: "rgba(59, 130, 246, 0.12)" },
  { accent: "#10b981", glow: "rgba(16, 185, 129, 0.12)" },
  { accent: "#14b8a6", glow: "rgba(20, 184, 166, 0.12)" },
  { accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.12)" },
] as const;

export function focusAccent(order: number): { accent: string; glow: string } {
  const index = Number.isFinite(order) ? Math.abs(Math.trunc(order)) % ACCENTS.length : 0;
  return ACCENTS[index];
}
