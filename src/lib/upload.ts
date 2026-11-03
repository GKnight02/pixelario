"use client";

import { createClient } from "./supabase/client";
import { MAX_UPLOAD_BYTES, PHOTO_BUCKET } from "./constants";

async function resize(file: File, maxSide: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", quality),
  );
}

/**
 * Redimensiona (máx. 1600 px) y sube una foto + su miniatura (480 px) al bucket privado.
 * Ruta: <owner_id>/<person_id>/<uuid>.jpg  (miniatura: <uuid>.thumb.jpg)
 * Devuelve la ruta guardada en la tabla.
 */
export async function uploadPhoto(file: File, personId: string, prefix = ""): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("La imagen supera los 5 MB");

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sesión expirada");

  const [full, thumb] = await Promise.all([resize(file, 1600, 0.85), resize(file, 480, 0.75)]);
  const name = `${prefix}${crypto.randomUUID()}`;
  const path = `${data.user.id}/${personId}/${name}.jpg`;
  const thumbPath = `${data.user.id}/${personId}/${name}.thumb.jpg`;

  const storage = supabase.storage.from(PHOTO_BUCKET);
  const opts = { contentType: "image/jpeg", upsert: false };
  const [a, b] = await Promise.all([storage.upload(path, full, opts), storage.upload(thumbPath, thumb, opts)]);
  if (a.error || b.error) throw new Error("No se pudo subir la foto");
  return path;
}

/** URL local de vista previa mientras se sube. */
export function previewUrl(file: File) {
  return URL.createObjectURL(file);
}
