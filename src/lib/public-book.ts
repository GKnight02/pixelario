import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import { signPaths, signPhotoSets } from "./photos";
import type { AnecdoteView, PublicBook } from "./types";

/** Cliente anónimo (rol anon): solo puede ejecutar get_public_book. */
function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const TOKEN_RE = /^[0-9a-f]{48}$/;

/**
 * Obtiene el libro público (deduplicado por petición con `cache`, así
 * generateMetadata y la página cuentan una sola visita).
 */
export const getPublicBook = cache(async (token: string, countView = true): Promise<PublicBook | null> => {
  if (!TOKEN_RE.test(token)) return null;
  const { data, error } = await anonClient().rpc("get_public_book", { token, p_count_view: countView });
  if (error || !data) return null;
  const book = data as PublicBook & { anecdotes?: (Omit<AnecdoteView, "photoUrls">)[] };

  // Firmar fotos de corta duración: solo rutas que get_public_book ya autorizó.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    admin = null;
  }

  let anecdotes: AnecdoteView[] | undefined;
  if (book.anecdotes) {
    const sign = admin
      ? await signPhotoSets(admin, book.anecdotes.flatMap((a) => a.photos), 60 * 15)
      : () => [];
    anecdotes = book.anecdotes.map((a) => ({ ...a, photoUrls: sign(a.photos) }));
  }

  let avatarSignedUrl: string | null = null;
  if (admin && book.person.avatar_url) {
    const map = await signPaths(admin, [book.person.avatar_url], 60 * 15);
    avatarSignedUrl = map[book.person.avatar_url] ?? null;
  }

  return { ...book, anecdotes, avatarSignedUrl };
});
