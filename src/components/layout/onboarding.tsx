"use client";

import { useActionState, useEffect, useState } from "react";
import { completeOnboarding, skipOnboarding } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/validation/schemas";
import { Guide } from "../guides/guide";
import { FieldError, FormMessage, Label, SubmitButton } from "../pixel/form";
import { buttonClasses } from "../pixel/pixel-button";
import { ColorPicker, RelationshipField } from "../shelf/person-form";

const STEPS = [
  "¡Bienvenido a Pixelario! Soy el búho bibliotecario. Primero, ¿cómo te llamas y en qué zona horaria vives? Así los recordatorios llegarán a tiempo.",
  "Ahora piensa en alguien importante. ¿Sobre quién será tu primer libro y qué relación tienen?",
  "Último paso: elige el color del lomo. Así lo reconocerás en tu estantería.",
];

function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Lima";
  } catch {
    return "America/Lima";
  }
}

export function Onboarding({ defaultName, timezones }: { defaultName: string; timezones: string[] }) {
  const [step, setStep] = useState(0);
  const [state, action] = useActionState<ActionState, FormData>(completeOnboarding, {});
  const [tz, setTz] = useState("America/Lima");
  // La zona del navegador solo se conoce en el cliente.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTz(detectTimeZone()), []);

  const next = (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.form!;
    const fields = form.querySelectorAll<HTMLInputElement>(`[data-step="${step}"] [required]`);
    for (const f of fields) {
      if (!f.reportValidity()) return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Guide key={step} animal="owl" scale={4} text={STEPS[step]} closable={false} />

      <ol className="flex gap-2" aria-label="Progreso">
        {STEPS.map((_, i) => (
          <li
            key={i}
            aria-current={i === step ? "step" : undefined}
            className={`h-3 flex-1 border-2 border-ink ${i <= step ? "bg-accent" : "bg-paper"}`}
          >
            <span className="sr-only">Paso {i + 1}</span>
          </li>
        ))}
      </ol>

      <form action={action} className="pixel-border paper flex flex-col gap-4 p-5">
        <div data-step="0" className={step === 0 ? "flex flex-col gap-4" : "hidden"}>
          <div>
            <Label htmlFor="display_name">Tu nombre</Label>
            <input
              id="display_name"
              name="display_name"
              required
              maxLength={60}
              defaultValue={defaultName}
              className="field"
            />
            <FieldError errors={state.errors?.display_name} />
          </div>
          <div>
            <Label htmlFor="timezone">Zona horaria</Label>
            <select key={tz} id="timezone" name="timezone" defaultValue={tz} className="field">
              {(timezones.includes(tz) ? timezones : [tz, ...timezones]).map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div data-step="1" className={step === 1 ? "flex flex-col gap-4" : "hidden"}>
          <div>
            <Label htmlFor="name">Nombre de la persona</Label>
            <input id="name" name="name" required maxLength={80} placeholder="Abuela Rosa" className="field" />
            <FieldError errors={state.errors?.name} />
          </div>
          <RelationshipField />
        </div>

        <div data-step="2" className={step === 2 ? "flex flex-col gap-4" : "hidden"}>
          <ColorPicker name="cover_color" />
        </div>

        <FormMessage message={state.message} />

        <div className="flex flex-wrap justify-between gap-3">
          {step > 0 ? (
            <button type="button" className={buttonClasses("paper")} onClick={() => setStep((s) => s - 1)}>
              Atrás
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className={buttonClasses("primary")} onClick={next}>
              Siguiente
            </button>
          ) : (
            <SubmitButton icon="books" pendingText="Encuadernando…">
              Crear mi primer libro
            </SubmitButton>
          )}
        </div>
      </form>

      <form action={skipOnboarding} className="text-center">
        <button type="submit" className="text-sm text-ink-soft underline">
          Saltar por ahora
        </button>
      </form>
    </div>
  );
}
