import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { formatDateTime } from "@/lib/dates";
import { BookDocument, registerPdfFonts } from "@/lib/pdf/book-document";
import { signPaths, thumbPath } from "@/lib/photos";
import { getAnecdotes, getPreferences } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { ImportantDate, Person, Profile } from "@/lib/types";
import { pdfChaptersSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const ORDER = ["gustos", "disgustos", "anecdotas", "fechas", "regalos", "recordatorios"];

/** Genera el libro en PDF con los capítulos elegidos. Las fotos van como miniaturas comprimidas. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/pdf/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: person } = await supabase.from("people").select("*").eq("id", id).maybeSingle();
  if (!person) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const parsed = pdfChaptersSchema.safeParse(
    (request.nextUrl.searchParams.get("caps") ?? "").split(",").filter(Boolean),
  );
  if (!parsed.success) return NextResponse.json({ error: "Capítulos inválidos" }, { status: 400 });
  const chapters = ORDER.filter((c) => parsed.data.includes(c as (typeof parsed.data)[number]));

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", auth.user.id).single();
  const tz = (profile as Profile | null)?.timezone ?? "America/Lima";
  const has = (c: string) => chapters.includes(c);

  const [likes, dislikes, anecdotes, dates, gifts, reminders, avatar] = await Promise.all([
    has("gustos") ? getPreferences(id, "like") : undefined,
    has("disgustos") ? getPreferences(id, "dislike") : undefined,
    has("anecdotas") ? getAnecdotes(id) : undefined,
    has("fechas")
      ? supabase
          .from("important_dates")
          .select("*")
          .eq("person_id", id)
          .order("month")
          .order("day")
          .then((r) => (r.data ?? []) as ImportantDate[])
      : undefined,
    has("regalos")
      ? supabase
          .from("gift_ideas")
          .select("title, status, price_estimate, note")
          .eq("person_id", id)
          .order("created_at", { ascending: false })
          .then((r) => r.data ?? [])
      : undefined,
    has("recordatorios")
      ? supabase
          .from("reminders")
          .select("title, due_at, repeat, note")
          .eq("person_id", id)
          .is("done_at", null)
          .order("due_at")
          .then((r) => (r.data ?? []).map((x) => ({ ...x, when: formatDateTime(x.due_at, tz) })))
      : undefined,
    person.avatar_url ? signPaths(supabase, [thumbPath(person.avatar_url)], 300) : Promise.resolve({}),
  ]);

  registerPdfFonts();
  const buffer = await renderToBuffer(
    BookDocument({
      person: person as Person,
      avatarUrl: person.avatar_url ? (avatar as Record<string, string>)[thumbPath(person.avatar_url)] ?? null : null,
      author: (profile as Profile | null)?.display_name ?? null,
      chapters,
      likes,
      dislikes,
      anecdotes,
      dates,
      gifts,
      reminders,
    }),
  );

  const slug = person.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="libro-de-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
