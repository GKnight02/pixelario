import "server-only";
import { headers } from "next/headers";

/** URL base del sitio: NEXT_PUBLIC_SITE_URL o, en su defecto, el host de la petición. */
export async function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Evita redirecciones abiertas: solo rutas internas. */
export function safeNext(next: string | null | undefined, fallback = "/estanteria") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function formToObject(formData: FormData) {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) obj[key] = value;
  }
  return obj;
}
