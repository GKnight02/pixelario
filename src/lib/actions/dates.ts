"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfile, requireUser } from "../auth";
import { dateTypeLabel } from "../constants";
import { remindersForDate } from "../dates";
import { formToObject } from "../site";
import type { ImportantDate, Profile } from "../types";
import { importantDateSchema, zodErrors, type ActionState } from "../validation/schemas";

/** Rehace los recordatorios automáticos de una fecha (por defecto 7 días antes y el mismo día). */
async function syncDateReminders(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile,
  date: ImportantDate,
  personName: string,
) {
  await supabase.from("reminders").delete().eq("date_id", date.id).is("done_at", null);
  const label = date.type === "custom" ? date.label : `${dateTypeLabel(date.type).toLowerCase()} de ${personName}`;
  const rows = remindersForDate(date, profile.timezone).map(({ daysBefore, dueAt }) => ({
    owner_id: userId,
    person_id: date.person_id,
    date_id: date.id,
    title:
      daysBefore === 0
        ? `¡Hoy es el ${label}!`
        : `En ${daysBefore} ${daysBefore === 1 ? "día" : "días"}: ${label}`,
    due_at: dueAt.toISOString(),
    repeat: date.recurring ? "yearly" : "none",
    channels: profile.default_reminder_channels,
  }));
  if (rows.length) await supabase.from("reminders").insert(rows);
}

export async function saveImportantDate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = importantDateSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase, user } = await requireUser();
  const profile = await getProfile();

  const { remind_7, remind_1, remind_0, ...rest } = parsed.data;
  const values = {
    ...rest,
    remind_days_before: [...(remind_7 ? [7] : []), ...(remind_1 ? [1] : []), ...(remind_0 ? [0] : [])],
  };

  const query = raw.id
    ? supabase.from("important_dates").update(values).eq("id", raw.id)
    : supabase.from("important_dates").insert(values);
  const { data, error } = await query.select("*").single();
  if (error || !data) return { message: "No se pudo guardar la fecha." };

  const { data: person } = await supabase.from("people").select("name").eq("id", rest.person_id).single();
  await syncDateReminders(supabase, user.id, profile, data as ImportantDate, person?.name ?? "");

  revalidatePath(`/libro/${rest.person_id}`, "layout");
  revalidatePath("/estanteria");
  revalidatePath("/recordatorios");
  return { ok: true, stamp: Date.now() };
}

export async function deleteImportantDate(formData: FormData) {
  const id = formData.get("id")?.toString();
  const personId = formData.get("person_id")?.toString();
  if (!id || !personId) return;
  const { supabase } = await requireUser();
  // Los recordatorios automáticos caen en cascada (reminders.date_id on delete cascade).
  await supabase.from("important_dates").delete().eq("id", id);
  revalidatePath(`/libro/${personId}`, "layout");
  revalidatePath("/estanteria");
  revalidatePath("/recordatorios");
}
