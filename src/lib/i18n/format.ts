const bengaliNumerals = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function toBengaliNumber(n: number): string {
  return String(n)
    .split("")
    .map((d) => bengaliNumerals[parseInt(d)] ?? d)
    .join("");
}

export function formatReadingTime(minutes: number | null | undefined, locale: string = "en"): string {
  if (minutes == null || minutes <= 0) return "";
  if (locale === "bn") {
    return `${toBengaliNumber(minutes)} মিনিট পড়ুন`;
  }
  return `${minutes} min read`;
}

export function formatDownloads(count: number | null | undefined, locale: string = "en"): string {
  if (count == null) return "";
  if (locale === "bn") {
    return `${toBengaliNumber(count)} ডাউনলোড`;
  }
  return `${count} downloads`;
}

export function formatDate(date: Date | string | null | undefined, locale: string = "en"): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "bn") {
    return d.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
