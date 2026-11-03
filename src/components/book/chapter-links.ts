import { CHAPTERS } from "@/lib/constants";

export interface ChapterLink {
  slug: string; // "" = portada
  title: string;
  short: string;
  icon: string;
  count?: number;
}

/** Server-safe: se puede llamar desde Server y Client Components. */
export function chapterLinks(counts?: Partial<Record<string, number>>): ChapterLink[] {
  return [
    { slug: "", title: "Portada", short: "Portada", icon: "books" },
    ...CHAPTERS.map((c) => ({ slug: c.slug, title: c.title, short: c.short, icon: c.icon, count: counts?.[c.key] })),
  ];
}
