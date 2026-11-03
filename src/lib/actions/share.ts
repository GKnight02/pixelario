"use server";

import { revalidatePath } from "next/cache";
import { getProfile, requireUser } from "../auth";
import { zonedTimeToUtc } from "../dates";
import { formToObject } from "../site";
import { shareSettingsSchema, zodErrors, type ActionState } from "../validation/schemas";

function revalidateShare(personId: string) {
  revalidatePath(`/libro/${personId}/compartir`);
}

/** Activa el link (lo crea si no existe) con los capítulos por defecto. */
export async function enableShareLink(formData: FormData) {
  const personId = formData.get("person_id")?.toString();
  if (!personId) return;
  const { supabase } = await requireUser();
  const { data: existing } = await supabase
    .from("share_links")
    .select("id")
    .eq("person_id", personId)
    .maybeSingle();
  if (existing) {
    await supabase.from("share_links").update({ is_active: true }).eq("id", existing.id);
  } else {
    await supabase.from("share_links").insert({ person_id: personId });
  }
  revalidateShare(personId);
}

export async function disableShareLink(formData: FormData) {
  const personId = formData.get("person_id")?.toString();
  if (!personId) return;
  const { supabase } = await requireUser();
  await supabase.from("share_links").update({ is_active: false }).eq("person_id", personId);
  revalidateShare(personId);
}

export async function regenerateShareLink(formData: FormData) {
  const personId = formData.get("person_id")?.toString();
  if (!personId) return;
  const { supabase } = await requireUser();
  await supabase.rpc("regenerate_share_token", { p_person_id: personId });
  revalidateShare(personId);
}

export async function saveShareSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = shareSettingsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const { supabase } = await requireUser();
  const profile = await getProfile();
  const { person_id, expires_on, ...sections } = parsed.data;

  let expires_at: string | null = null;
  if (expires_on) {
    const [year, month, day] = expires_on.split("-").map(Number);
    // Expira al final de ese día en la zona horaria del autor.
    expires_at = zonedTimeToUtc({ year, month, day }, 23, 59, profile.timezone).toISOString();
    if (new Date(expires_at) <= new Date()) {
      return { errors: { expires_on: ["La fecha de expiración debe ser futura"] } };
    }
  }

  const { error } = await supabase
    .from("share_links")
    .update({ sections, expires_at })
    .eq("person_id", person_id);
  if (error) return { message: "No se pudo guardar." };
  revalidateShare(person_id);
  return { ok: true, stamp: Date.now(), message: "Cambios guardados." };
}
