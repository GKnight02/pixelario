"use server";

import { revalidatePath } from "next/cache";
import { getProfile, requireUser } from "../auth";
import { advanceDueAt, fromDateTimeLocal } from "../dates";
import { formToObject } from "../site";
import type { Repeat } from "../types";
import { reminderSchema, zodErrors, type ActionState } from "../validation/schemas";

function revalidateReminders(personId?: string | null) {
  revalidatePath("/recordatorios");
  revalidatePath("/", "layout"); // contador del zorro en la cabecera
  if (personId) revalidatePath(`/libro/${personId}`, "layout");
}

export async function saveReminder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = reminderSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase, user } = await requireUser();
  const profile = await getProfile();

  const { due_local, channel_app, channel_email, ...rest } = parsed.data;
  const values = {
    ...rest,
    due_at: fromDateTimeLocal(due_local, profile.timezone).toISOString(),
    channels: [...(channel_app ? ["app"] : []), ...(channel_email ? ["email"] : [])],
    last_sent_at: null,
  };

  const { error } = raw.id
    ? await supabase.from("reminders").update(values).eq("id", raw.id)
    : await supabase.from("reminders").insert({ ...values, owner_id: user.id });
  if (error) return { message: "No se pudo guardar el recordatorio." };

  revalidateReminders(rest.person_id);
  return { ok: true, stamp: Date.now() };
}

/** Marca como hecho; si se repite, avanza a la siguiente fecha. */
export async function completeReminder(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const { supabase } = await requireUser();
  const profile = await getProfile();
  const { data: r } = await supabase
    .from("reminders")
    .select("due_at, repeat, person_id")
    .eq("id", id)
    .single();
  if (!r) return;

  if (r.repeat === "none") {
    await supabase.from("reminders").update({ done_at: new Date().toISOString() }).eq("id", id);
  } else {
    const next = advanceDueAt(r.due_at, r.repeat as Repeat, profile.timezone);
    await supabase
      .from("reminders")
      .update({ due_at: next.toISOString(), last_sent_at: null, done_at: null })
      .eq("id", id);
  }
  revalidateReminders(r.person_id);
}

/** Pospone 1 día (o las horas indicadas). */
export async function postponeReminder(formData: FormData) {
  const id = formData.get("id")?.toString();
  const hours = Number(formData.get("hours") ?? 24);
  if (!id || !Number.isFinite(hours) || hours <= 0 || hours > 24 * 30) return;
  const { supabase } = await requireUser();
  const due = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("reminders")
    .update({ due_at: due, last_sent_at: null })
    .eq("id", id)
    .select("person_id")
    .single();
  revalidateReminders(data?.person_id);
}

export async function reopenReminder(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("reminders")
    .update({ done_at: null })
    .eq("id", id)
    .select("person_id")
    .single();
  revalidateReminders(data?.person_id);
}

export async function deleteReminder(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("reminders").delete().eq("id", id).select("person_id").single();
  revalidateReminders(data?.person_id);
}
