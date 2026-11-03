"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import { formToObject } from "../site";
import { giftSchema, zodErrors, type ActionState } from "../validation/schemas";

export async function saveGift(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = giftSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase } = await requireUser();

  const { error } = raw.id
    ? await supabase.from("gift_ideas").update(parsed.data).eq("id", raw.id)
    : await supabase.from("gift_ideas").insert(parsed.data);
  if (error) return { message: "No se pudo guardar la idea." };

  revalidatePath(`/libro/${parsed.data.person_id}`, "layout");
  return { ok: true, stamp: Date.now(), data: { status: parsed.data.status, title: parsed.data.title } };
}

export async function setGiftStatus(formData: FormData) {
  const id = formData.get("id")?.toString();
  const personId = formData.get("person_id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !personId || !status || !["idea", "bought", "given"].includes(status)) return;
  const { supabase } = await requireUser();
  await supabase.from("gift_ideas").update({ status }).eq("id", id);
  revalidatePath(`/libro/${personId}`, "layout");
  revalidatePath("/recordatorios");
}

/** El zorro convierte un gusto en idea de regalo. */
export async function giftFromPreference(formData: FormData) {
  const preferenceId = formData.get("preference_id")?.toString();
  const personId = formData.get("person_id")?.toString();
  if (!preferenceId || !personId) return;
  const { supabase } = await requireUser();
  const { data: pref } = await supabase
    .from("preferences")
    .select("title, note")
    .eq("id", preferenceId)
    .single();
  if (!pref) return;
  await supabase.from("gift_ideas").insert({
    person_id: personId,
    preference_id: preferenceId,
    title: pref.title,
    note: pref.note,
    status: "idea",
  });
  revalidatePath(`/libro/${personId}`, "layout");
}

export async function deleteGift(formData: FormData) {
  const id = formData.get("id")?.toString();
  const personId = formData.get("person_id")?.toString();
  if (!id || !personId) return;
  const { supabase } = await requireUser();
  await supabase.from("gift_ideas").delete().eq("id", id);
  revalidatePath(`/libro/${personId}`, "layout");
}
