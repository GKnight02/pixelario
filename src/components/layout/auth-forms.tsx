"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendMagicLink, signIn, signInWithGoogle, signUp } from "@/lib/actions/auth";
import { FieldError, FormMessage, Label, SubmitButton } from "../pixel/form";
import { buttonClasses } from "../pixel/pixel-button";
import type { ActionState } from "@/lib/validation/schemas";

function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next ?? ""} />
      <SubmitButton variant="paper" className="w-full" pendingText="Abriendo Google…">
        <svg width="16" height="16" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden>
          <rect x="2" y="0" width="4" height="1" fill="#ea4335" />
          <rect x="1" y="1" width="1" height="2" fill="#ea4335" />
          <rect x="0" y="2" width="1" height="4" fill="#fbbc05" />
          <rect x="1" y="5" width="1" height="2" fill="#34a853" />
          <rect x="2" y="7" width="4" height="1" fill="#34a853" />
          <rect x="6" y="5" width="1" height="2" fill="#4285f4" />
          <rect x="4" y="4" width="4" height="1" fill="#4285f4" />
          <rect x="7" y="4" width="1" height="2" fill="#4285f4" />
        </svg>
        Continuar con Google
      </SubmitButton>
    </form>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-soft" aria-hidden>
      <span className="h-0.5 flex-1 bg-ink/30" />o<span className="h-0.5 flex-1 bg-ink/30" />
    </div>
  );
}

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [state, action] = useActionState<ActionState, FormData>(signIn, {});
  const [magicState, magicAction] = useActionState<ActionState, FormData>(sendMagicLink, {});

  return (
    <div className="flex flex-col gap-4">
      {error ? <FormMessage message="No se pudo iniciar sesión. Intenta otra vez." /> : null}
      <GoogleButton next={next} />
      <Divider />

      <div role="tablist" aria-label="Forma de entrar" className="grid grid-cols-2 gap-2">
        {(["password", "magic"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={buttonClasses(mode === m ? "primary" : "paper", "sm")}
          >
            {m === "password" ? "Contraseña" : "Enlace mágico"}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <Label htmlFor="email">Correo</Label>
            <input id="email" name="email" type="email" autoComplete="email" required className="field" />
            <FieldError errors={state.errors?.email} />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="field"
            />
            <FieldError errors={state.errors?.password} />
          </div>
          <FormMessage message={state.message} ok={state.ok} />
          <SubmitButton icon="door" pendingText="Entrando…">
            Entrar
          </SubmitButton>
        </form>
      ) : (
        <form action={magicAction} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <Label htmlFor="magic-email">Correo</Label>
            <input
              id="magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="field"
            />
            <FieldError errors={magicState.errors?.email} />
          </div>
          <FormMessage message={magicState.message} ok={magicState.ok} />
          <SubmitButton icon="envelope" pendingText="Enviando…">
            Enviarme el enlace
          </SubmitButton>
        </form>
      )}

      <p className="text-center">
        ¿Primera vez?{" "}
        <Link href="/registro" className="font-semibold underline decoration-2 underline-offset-4">
          Crea tu cuenta
        </Link>
      </p>
    </div>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<ActionState, FormData>(signUp, {});

  if (state.ok) return <FormMessage message={state.message} ok />;

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton next="/bienvenida" />
      <Divider />
      <form action={action} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="display_name">¿Cómo te llamas?</Label>
          <input id="display_name" name="display_name" autoComplete="name" required className="field" />
          <FieldError errors={state.errors?.display_name} />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
          <FieldError errors={state.errors?.email} />
        </div>
        <div>
          <Label htmlFor="password" hint="mínimo 8 caracteres">
            Contraseña
          </Label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="field"
          />
          <FieldError errors={state.errors?.password} />
        </div>
        <FormMessage message={state.message} ok={state.ok} />
        <SubmitButton icon="pencil" pendingText="Creando…">
          Crear mi cuenta
        </SubmitButton>
      </form>
      <p className="text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold underline decoration-2 underline-offset-4">
          Entra aquí
        </Link>
      </p>
    </div>
  );
}
