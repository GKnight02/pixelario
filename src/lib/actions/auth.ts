"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { formToObject, getSiteUrl, safeNext } from "../site";
import {
  loginSchema,
  magicLinkSchema,
  signupSchema,
  zodErrors,
  type ActionState,
} from "../validation/schemas";

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return {
      message:
        error.code === "email_not_confirmed"
          ? "Confirma tu correo antes de entrar (revisa tu bandeja)."
          : "Correo o contraseña incorrectos.",
    };
  }
  redirect(safeNext(parsed.data.next));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const supabase = await createClient();
  const site = await getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.display_name },
      emailRedirectTo: `${site}/auth/callback?next=/bienvenida`,
    },
  });
  if (error) {
    return { message: error.code === "user_already_exists" ? "Ese correo ya tiene cuenta." : error.message };
  }
  if (data.session) redirect("/bienvenida");
  return {
    ok: true,
    message: "¡Listo! Te enviamos un correo para confirmar tu cuenta. El búho te espera.",
  };
}

export async function sendMagicLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = magicLinkSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const supabase = await createClient();
  const site = await getSiteUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(safeNext(parsed.data.next))}`,
    },
  });
  if (error) return { message: "No pudimos enviar el enlace. Intenta de nuevo en un momento." };
  return { ok: true, message: "Revisa tu correo: te enviamos un enlace mágico." };
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const site = await getSiteUrl();
  const next = safeNext(formData.get("next")?.toString());
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
