import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET } from "./constants";

/** Por convención cada foto tiene una miniatura comprimida: foto.jpg → foto.thumb.jpg */
export function thumbPath(path: string) {
  return path.replace(/\.(\w+)$/, ".thumb.$1");
}

/**
 * Firma URLs de corta duración para un conjunto de rutas.
 * Devuelve un mapa ruta → URL firmada.
 */
export async function signPaths(
  supabase: SupabaseClient,
  paths: string[],
  expiresIn = 60 * 60,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, expiresIn);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

/** Firma fotos completas y miniaturas (si falta la miniatura usa la completa). */
export async function signPhotoSets(supabase: SupabaseClient, photos: string[], expiresIn?: number) {
  const all = photos.flatMap((p) => [p, thumbPath(p)]);
  const map = await signPaths(supabase, all, expiresIn);
  return (list: string[]) =>
    list
      .filter((p) => map[p])
      .map((p) => ({ full: map[p], thumb: map[thumbPath(p)] ?? map[p] }));
}

/** Rutas que pertenecen al usuario (primer segmento = owner_id). */
export function ownsPath(path: string, userId: string) {
  return path.split("/")[0] === userId && !path.includes("..");
}
