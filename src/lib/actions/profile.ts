"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import { PHOTO_BUCKET } from "../constants";
import { isValidTimeZone } from "../dates";
import { formToObject } from "../site";
import { onboardingSchema, profileSchema, zodErrors, type ActionState } from "../validation/schemas";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  if (!isValidTimeZone(parsed.data.timezone)) return { errors: { timezone: ["Zona horaria inválida"] } };

  const channels = [
    ...(parsed.data.channel_app ? ["app"] : []),
    ...(parsed.data.channel_email ? ["email"] : []),
  ];
  if (channels.length === 0) return { errors: { channel_app: ["Elige al menos un canal"] } };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      timezone: parsed.data.timezone,
      theme: parsed.data.theme,
      default_reminder_channels: channels,
    })
    .eq("id", user.id);
  if (error) return { message: "No se pudo guardar el perfil." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil guardado.", stamp: Date.now(), data: { theme: parsed.data.theme } };
}

export async function completeOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = onboardingSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const tz = isValidTimeZone(parsed.data.timezone) ? parsed.data.timezone : "America/Lima";

  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ display_name: parsed.data.display_name, timezone: tz, onboarded: true })
    .eq("id", user.id);

  const { data: person, error } = await supabase
    .from("people")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      cover_color: parsed.data.cover_color,
    })
    .select("id")
    .single();
  if (error || !person) return { message: "No se pudo crear el libro. Intenta otra vez." };

  revalidatePath("/estanteria");
  redirect(`/libro/${person.id}/gustos?primera=1`);
}

export async function skipOnboarding() {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
  redirect("/estanteria");
}

/** Borra recursivamente las fotos del usuario y luego su cuenta (cascade en BD). */
export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm")?.toString().trim().toUpperCase() !== "BORRAR") {
    return { errors: { confirm: ['Escribe "BORRAR" para confirmar'] } };
  }
  const { supabase, user } = await requireUser();

  const storage = supabase.storage.from(PHOTO_BUCKET);
  const { data: folders } = await storage.list(user.id, { limit: 1000 });
  for (const folder of folders ?? []) {
    const prefix = `${user.id}/${folder.name}`;
    const { data: files } = await storage.list(prefix, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${prefix}/${f.name}`);
    if (paths.length) await storage.remove(paths);
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { message: "No se pudo eliminar la cuenta." };
  await supabase.auth.signOut();
  redirect("/?adios=1");
}
