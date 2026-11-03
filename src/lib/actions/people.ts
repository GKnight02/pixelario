"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import { PHOTO_BUCKET } from "../constants";
import { ownsPath, thumbPath } from "../photos";
import { formToObject } from "../site";
import { personSchema, zodErrors, type ActionState } from "../validation/schemas";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createPerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = formToObject(formData);
  const parsed = personSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase, user } = await requireUser();

  // El id se genera en el navegador para poder subir el avatar a <owner>/<person>/ antes de crear.
  const id = UUID_RE.test(raw.id ?? "") ? raw.id : crypto.randomUUID();
  const avatar = parsed.data.avatar_url;
  if (avatar && (!ownsPath(avatar, user.id) || !avatar.startsWith(`${user.id}/${id}/`))) {
    return { message: "Avatar inválido." };
  }

  const { data, error } = await supabase
    .from("people")
    .insert({ ...parsed.data, id, owner_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { message: "No se pudo crear el libro." };

  revalidatePath("/estanteria");
  redirect(`/libro/${data.id}`);
}

export async function updatePerson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get("id")?.toString();
  const parsed = personSchema.safeParse(formToObject(formData));
  if (!id || !parsed.success) return { errors: parsed.success ? {} : zodErrors(parsed.error) };
  const { supabase, user } = await requireUser();

  const avatar = parsed.data.avatar_url;
  if (avatar && (!ownsPath(avatar, user.id) || !avatar.startsWith(`${user.id}/${id}/`))) {
    return { message: "Avatar inválido." };
  }

  const { data: before } = await supabase.from("people").select("avatar_url").eq("id", id).single();
  const { error } = await supabase.from("people").update(parsed.data).eq("id", id);
  if (error) return { message: "No se pudo guardar." };

  if (before?.avatar_url && before.avatar_url !== avatar) {
    await supabase.storage.from(PHOTO_BUCKET).remove([before.avatar_url, thumbPath(before.avatar_url)]);
  }

  revalidatePath(`/libro/${id}`, "layout");
  revalidatePath("/estanteria");
  return { ok: true, stamp: Date.now(), message: "Portada guardada." };
}

export async function deletePerson(formData: FormData) {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const { supabase, user } = await requireUser();

  // Borra las fotos del libro antes de borrar la fila (las tablas hijas caen en cascada).
  const prefix = `${user.id}/${id}`;
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(prefix, { limit: 1000 });
  const paths = (files ?? []).map((f) => `${prefix}/${f.name}`);
  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);

  await supabase.from("people").delete().eq("id", id);
  revalidatePath("/estanteria");
  redirect("/estanteria");
}
