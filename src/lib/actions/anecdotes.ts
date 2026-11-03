"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import { PHOTO_BUCKET } from "../constants";
import { ownsPath, thumbPath } from "../photos";
import { formToObject } from "../site";
import { anecdoteSchema, zodErrors, type ActionState } from "../validation/schemas";

export async function saveAnecdote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  let parsed;
  try {
    parsed = anecdoteSchema.safeParse(raw);
  } catch {
    return { message: "Fotos inválidas." };
  }
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase, user } = await requireUser();

  const prefix = `${user.id}/${parsed.data.person_id}/`;
  if (parsed.data.photos.some((p) => !ownsPath(p, user.id) || !p.startsWith(prefix))) {
    return { message: "Alguna foto no pertenece a este libro." };
  }

  let removed: string[] = [];
  if (raw.id) {
    const { data: before } = await supabase.from("anecdotes").select("photos").eq("id", raw.id).single();
    removed = (before?.photos ?? []).filter((p: string) => !parsed.data.photos.includes(p));
  }

  const { error } = raw.id
    ? await supabase.from("anecdotes").update(parsed.data).eq("id", raw.id)
    : await supabase.from("anecdotes").insert(parsed.data);
  if (error) return { message: "No se pudo guardar el recuerdo." };

  if (removed.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(removed.flatMap((p) => [p, thumbPath(p)]));
  }

  revalidatePath(`/libro/${parsed.data.person_id}`, "layout");
  return { ok: true, stamp: Date.now() };
}

export async function deleteAnecdote(formData: FormData) {
  const id = formData.get("id")?.toString();
  const personId = formData.get("person_id")?.toString();
  if (!id || !personId) return;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("anecdotes").select("photos").eq("id", id).single();
  await supabase.from("anecdotes").delete().eq("id", id);
  const photos: string[] = data?.photos ?? [];
  if (photos.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.flatMap((p) => [p, thumbPath(p)]));
  }
  revalidatePath(`/libro/${personId}`, "layout");
}
