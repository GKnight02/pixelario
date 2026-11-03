import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { formatDateTime } from "@/lib/dates";
import { ReminderEmail } from "@/lib/email/reminder-email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DueReminder {
  id: string;
  owner_id: string;
  person_id: string | null;
  title: string;
  note: string | null;
  due_at: string;
  person: { name: string } | null;
}

/**
 * Vercel Cron (cada hora): envía por correo los recordatorios cuya hora local
 * ya llegó (due_at ya está en UTC calculado con la zona del usuario) y que aún
 * no tienen last_sent_at. Protegido con Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: "Falta configurar Resend" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  const { data, error } = await supabase
    .from("reminders")
    .select("id, owner_id, person_id, title, note, due_at, person:people(name)")
    .is("done_at", null)
    .is("last_sent_at", null)
    .lte("due_at", new Date().toISOString())
    .contains("channels", ["email"])
    .order("due_at")
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = (data ?? []) as unknown as DueReminder[];
  const byOwner = new Map<string, DueReminder[]>();
  for (const r of due) byOwner.set(r.owner_id, [...(byOwner.get(r.owner_id) ?? []), r]);

  let sent = 0;
  const failures: string[] = [];

  for (const [ownerId, reminders] of byOwner) {
    try {
      const [{ data: userData }, { data: profile }] = await Promise.all([
        supabase.auth.admin.getUserById(ownerId),
        supabase.from("profiles").select("display_name, timezone").eq("id", ownerId).single(),
      ]);
      const email = userData.user?.email;
      if (!email) continue;
      const tz = profile?.timezone ?? "America/Lima";

      // Ideas de regalo pendientes de las personas involucradas.
      const personIds = [...new Set(reminders.map((r) => r.person_id).filter(Boolean))] as string[];
      const { data: gifts } = personIds.length
        ? await supabase
            .from("gift_ideas")
            .select("person_id, title")
            .in("person_id", personIds)
            .in("status", ["idea", "bought"])
            .limit(50)
        : { data: [] as { person_id: string; title: string }[] };

      const { error: sendError } = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject:
          reminders.length === 1 ? `🦊 ${reminders[0].title}` : `🦊 Tienes ${reminders.length} recordatorios`,
        react: ReminderEmail({
          name: profile?.display_name ?? null,
          siteUrl,
          reminders: reminders.map((r) => ({
            title: r.title,
            note: r.note,
            when: formatDateTime(r.due_at, tz),
            personName: r.person?.name ?? null,
            personId: r.person_id,
            gifts: (gifts ?? [])
              .filter((g) => g.person_id === r.person_id)
              .slice(0, 3)
              .map((g) => g.title),
          })),
        }),
      });
      if (sendError) throw new Error(sendError.message);

      await supabase
        .from("reminders")
        .update({ last_sent_at: new Date().toISOString() })
        .in(
          "id",
          reminders.map((r) => r.id),
        );
      sent += reminders.length;
    } catch (e) {
      failures.push(`${ownerId}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({ checked: due.length, sent, failures: failures.length });
}
