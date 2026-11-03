import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getProfile, requireUser } from "./auth";
import { daysUntil, nextOccurrence, todayIn, type YMD } from "./dates";
import { signPaths, signPhotoSets, thumbPath } from "./photos";
import type {
  AnecdoteView,
  Category,
  GiftIdea,
  ImportantDate,
  Person,
  Preference,
  PreferenceView,
  Reminder,
  ShareLink,
} from "./types";

export interface ShelfBook extends Person {
  avatarSignedUrl: string | null;
  nextBirthdayDays: number | null;
}

export interface UpcomingDate extends ImportantDate {
  person: Pick<Person, "id" | "name" | "cover_color">;
  days: number;
  next: YMD;
}

/** Estantería: libros, próximas fechas y conteos. */
export async function getShelf() {
  const { supabase } = await requireUser();
  const profile = await getProfile();
  const today = todayIn(profile.timezone);

  const [{ data: people }, { data: dates }] = await Promise.all([
    supabase.from("people").select("*").order("name"),
    supabase.from("important_dates").select("*, person:people(id, name, cover_color)"),
  ]);

  const allDates = (dates ?? []) as (ImportantDate & { person: UpcomingDate["person"] })[];
  const avatarMap = await signPaths(
    supabase,
    (people ?? []).map((p: Person) => (p.avatar_url ? thumbPath(p.avatar_url) : "")),
  );

  const books: ShelfBook[] = ((people ?? []) as Person[]).map((p) => {
    const birthdays = allDates.filter((d) => d.person_id === p.id && d.type === "birthday");
    const days = birthdays
      .map((d) => daysUntil(d, today))
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b)[0];
    return {
      ...p,
      avatarSignedUrl: p.avatar_url ? avatarMap[thumbPath(p.avatar_url)] ?? null : null,
      nextBirthdayDays: days ?? null,
    };
  });

  const upcoming: UpcomingDate[] = allDates
    .map((d) => {
      const next = nextOccurrence(d, today);
      return next ? { ...d, next, days: daysUntil(d, today)! } : null;
    })
    .filter((d): d is UpcomingDate => d !== null && d.days <= 60)
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);

  return { books, upcoming, profile };
}

/** Libro: persona, avatar firmado, fechas y conteo por capítulo. */
export const getBook = cache(async (id: string) => {
  const { supabase } = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: person } = await supabase.from("people").select("*").eq("id", id).maybeSingle();
  if (!person) notFound();

  const profile = await getProfile();
  const today = todayIn(profile.timezone);

  const count = (table: string, filter?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = supabase.from(table).select("id", { count: "exact", head: true }).eq("person_id", id);
    if (filter) q = filter(q);
    return q.then((r: { count: number | null }) => r.count ?? 0);
  };

  const [dates, likes, dislikes, anecdotes, gifts, reminders, avatar] = await Promise.all([
    supabase
      .from("important_dates")
      .select("*")
      .eq("person_id", id)
      .then((r) => (r.data ?? []) as ImportantDate[]),
    count("preferences", (q) => q.eq("kind", "like")),
    count("preferences", (q) => q.eq("kind", "dislike")),
    count("anecdotes"),
    count("gift_ideas"),
    count("reminders", (q) => q.is("done_at", null)),
    person.avatar_url ? signPaths(supabase, [person.avatar_url]) : Promise.resolve({} as Record<string, string>),
  ]);

  const nextDates = dates
    .map((d) => ({ ...d, days: daysUntil(d, today), next: nextOccurrence(d, today) }))
    .filter((d) => d.days !== null)
    .sort((a, b) => a.days! - b.days!);

  return {
    person: person as Person,
    avatarSignedUrl: person.avatar_url ? avatar[person.avatar_url] ?? null : null,
    nextDate: nextDates[0] ?? null,
    birthdayToday: dates.some((d) => d.type === "birthday" && daysUntil(d, today) === 0),
    counts: { likes, dislikes, anecdotes, dates: dates.length, gifts, reminders },
    profile,
  };
});

export async function getCategories() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
  return (data ?? []) as Category[];
}

export async function getPreferences(personId: string, kind: "like" | "dislike") {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("preferences")
    .select("*, category:categories(name, icon, sort_order)")
    .eq("person_id", personId)
    .eq("kind", kind)
    .order("intensity", { ascending: false })
    .order("created_at");
  type Row = Preference & { category: { name: string; icon: string; sort_order: number } | null };
  return ((data ?? []) as Row[])
    .sort((a, b) => (a.category?.sort_order ?? 999) - (b.category?.sort_order ?? 999))
    .map(
      (p): PreferenceView => ({
        id: p.id,
        title: p.title,
        note: p.note,
        intensity: p.intensity,
        kind: p.kind,
        category_id: p.category_id,
        category_name: p.category?.name ?? null,
        category_icon: p.category?.icon ?? null,
        changed_at: p.changed_at,
      }),
    );
}

export async function getAnecdotes(personId: string): Promise<AnecdoteView[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("anecdotes")
    .select("*")
    .eq("person_id", personId)
    .order("happened_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as AnecdoteView[];
  const sign = await signPhotoSets(supabase, rows.flatMap((r) => r.photos));
  return rows.map((r) => ({ ...r, photoUrls: sign(r.photos) }));
}

export async function getDates(personId: string) {
  const { supabase } = await requireUser();
  const profile = await getProfile();
  const today = todayIn(profile.timezone);
  const { data } = await supabase.from("important_dates").select("*").eq("person_id", personId);
  return ((data ?? []) as ImportantDate[])
    .map((d) => ({ ...d, days: daysUntil(d, today), next: nextOccurrence(d, today) }))
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
}

export async function getGifts(personId: string) {
  const { supabase } = await requireUser();
  const [{ data: gifts }, { data: likes }, { data: dates }] = await Promise.all([
    supabase.from("gift_ideas").select("*").eq("person_id", personId).order("created_at", { ascending: false }),
    supabase
      .from("preferences")
      .select("id, title, intensity")
      .eq("person_id", personId)
      .eq("kind", "like")
      .order("intensity", { ascending: false }),
    supabase.from("important_dates").select("id, label, month, day").eq("person_id", personId),
  ]);
  return {
    gifts: (gifts ?? []) as GiftIdea[],
    likes: (likes ?? []) as Pick<Preference, "id" | "title" | "intensity">[],
    dates: (dates ?? []) as Pick<ImportantDate, "id" | "label" | "month" | "day">[],
  };
}

export async function getReminders(opts: { personId?: string } = {}) {
  const { supabase } = await requireUser();
  let q = supabase
    .from("reminders")
    .select("*, person:people(id, name, cover_color)")
    .order("due_at", { ascending: true });
  if (opts.personId) q = q.eq("person_id", opts.personId);
  const { data } = await q;
  return (data ?? []) as (Reminder & { person: Pick<Person, "id" | "name" | "cover_color"> | null })[];
}

/** Recordatorios vencidos en la app (contador del zorro). */
export const getPendingCount = cache(async () => {
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .is("done_at", null)
    .lte("due_at", new Date().toISOString())
    .contains("channels", ["app"]);
  return count ?? 0;
});

export async function getShareLink(personId: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("share_links").select("*").eq("person_id", personId).maybeSingle();
  return data as ShareLink | null;
}

export async function getPeopleOptions() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("people").select("id, name").order("name");
  return (data ?? []) as Pick<Person, "id" | "name">[];
}
