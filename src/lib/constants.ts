import type { DateType, GiftStatus, Repeat, ShareSections } from "./types";

export const CHAPTERS = [
  { slug: "gustos", key: "likes", title: "Le gusta", short: "Gustos", icon: "heart" },
  { slug: "disgustos", key: "dislikes", title: "No le gusta", short: "Disgustos", icon: "skull" },
  { slug: "anecdotas", key: "anecdotes", title: "Anécdotas", short: "Anécdotas", icon: "camera" },
  { slug: "fechas", key: "dates", title: "Fechas importantes", short: "Fechas", icon: "cake" },
  { slug: "regalos", key: "gifts", title: "Ideas de regalo", short: "Regalos", icon: "gift" },
  { slug: "recordatorios", key: "reminders", title: "Recordatorios", short: "Avisos", icon: "bell" },
] as const;

export type ChapterSlug = (typeof CHAPTERS)[number]["slug"];
export type ChapterKey = keyof ShareSections;

export function getChapter(slug: string) {
  return CHAPTERS.find((c) => c.slug === slug);
}

export const DEFAULT_SECTIONS: ShareSections = {
  likes: true,
  dislikes: true,
  anecdotes: true,
  dates: false,
  gifts: false,
  reminders: false,
};

export const RELATIONSHIPS = [
  "amigo",
  "amiga",
  "familia",
  "pareja",
  "colega",
  "vecino",
  "mentor",
  "otro",
] as const;

export const COVER_COLORS = [
  "#8B3A3A",
  "#B04A5A",
  "#E0A030",
  "#5A8F4E",
  "#3E6E8E",
  "#5C4A8B",
  "#7A4E2D",
  "#2F4F4F",
  "#C0603A",
  "#8E7CC3",
] as const;

export const CATEGORY_ICONS = [
  "food",
  "drink",
  "music",
  "movies",
  "books",
  "places",
  "activities",
  "colors",
  "animals",
  "other",
  "heart",
  "star",
  "gift",
  "camera",
] as const;

export const MOODS = [
  { value: "divertido", label: "Divertido", icon: "smile", color: "var(--accent)" },
  { value: "emotivo", label: "Emotivo", icon: "drop", color: "#3E6E8E" },
  { value: "epico", label: "Épico", icon: "star", color: "var(--leaf)" },
  { value: "vergonzoso", label: "Vergonzoso", icon: "blush", color: "var(--berry)" },
  { value: "tierno", label: "Tierno", icon: "heart", color: "#C0607A" },
  { value: "nostalgico", label: "Nostálgico", icon: "hourglass", color: "#8E7CC3" },
] as const;

export function getMood(value: string | null | undefined) {
  return MOODS.find((m) => m.value === value);
}

export const DATE_TYPES: { value: DateType; label: string; icon: string }[] = [
  { value: "birthday", label: "Cumpleaños", icon: "cake" },
  { value: "anniversary", label: "Aniversario", icon: "heart" },
  { value: "saint", label: "Santo", icon: "star" },
  { value: "custom", label: "Otra fecha", icon: "calendar" },
];

export function dateTypeLabel(type: DateType) {
  return DATE_TYPES.find((d) => d.value === type)?.label ?? "Fecha";
}

export const GIFT_STATUSES: { value: GiftStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "bought", label: "Comprado" },
  { value: "given", label: "Regalado" },
];

export const REPEATS: { value: Repeat; label: string }[] = [
  { value: "none", label: "No se repite" },
  { value: "weekly", label: "Cada semana" },
  { value: "monthly", label: "Cada mes" },
  { value: "yearly", label: "Cada año" },
];

export const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const PHOTO_BUCKET = "photos";
export const MAX_PHOTOS = 4;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
