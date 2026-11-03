import "server-only";

/**
 * Límite de solicitudes simple en memoria (ventana deslizante por clave).
 * En serverless cada instancia tiene su propia memoria, así que es una
 * protección de "mejor esfuerzo" contra abuso del contador y de la función
 * pública. Para algo estricto, usar Vercel Firewall o Upstash Ratelimit.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: list.length <= limit, remaining: Math.max(0, limit - list.length) };
}
