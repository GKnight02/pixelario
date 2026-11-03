import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Usuario autenticado + cliente; redirige a /login si no hay sesión. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
});

export const getProfile = cache(async (): Promise<Profile> => {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (
    (data as Profile | null) ?? {
      id: user.id,
      display_name: null,
      timezone: "America/Lima",
      theme: "system",
      default_reminder_channels: ["app", "email"],
      onboarded: false,
    }
  );
});
