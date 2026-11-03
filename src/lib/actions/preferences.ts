"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import { formToObject } from "../site";
import {
  categorySchema,
  preferenceSchema,
  zodErrors,
  type ActionState,
} from "../validation/schemas";

function revalidateBook(personId: string) {
  revalidatePath(`/libro/${personId}`, "layout");
}

/** Crea o edita (si viene `id`) un ítem de gustos/disgustos. */
export async function savePreference(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = preferenceSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase } = await requireUser();

  const { error } = raw.id
    ? await supabase.from("preferences").update(parsed.data).eq("id", raw.id)
    : await supabase.from("preferences").insert(parsed.data);
  if (error) return { message: "No se pudo guardar." };

  revalidateBook(parsed.data.person_id);
  return { ok: true, stamp: Date.now() };
}

/** Mueve un ítem entre "le gusta" y "no le gusta", guardando la fecha del cambio. */
export async function togglePreferenceKind(formData: FormData) {
  const id = formData.get("id")?.toString();
  const personId = formData.get("person_id")?.toString();
  if (!id || !personId) return;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("preferences").select("kind").eq("id", id).single();
  if (!data) return;
  await supabase
    .from("preferences")
    .update({ kind: data.kind === "like" ? "dislike" : "like", changed_at: new Date().toISOString() })
    .eq("id", id);
  revalidateBook(personId);
}

export async function deletePreference(formData: FormData) {
  const id = formData.get("id")?.toString();
  const personId = formData.get("person_id")?.toString();
  if (!id || !personId) return;
  const { supabase } = await requireUser();
  await supabase.from("preferences").delete().eq("id", id);
  revalidateBook(personId);
}

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id, name, icon")
    .single();
  if (error || !data) return { message: "No se pudo crear la categoría." };
  revalidatePath("/libro", "layout");
  return { ok: true, stamp: Date.now(), data };
}
