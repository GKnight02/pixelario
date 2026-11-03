"use client";

import { useActionState, useEffect } from "react";
import { deleteAccount, updateProfile } from "@/lib/actions/profile";
import type { Profile, Theme } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { FieldError, FormMessage, Label, SubmitButton } from "../pixel/form";
import { buttonClasses } from "../pixel/pixel-button";
import { PixelIcon } from "../pixel/pixel-icon";
import { Stamp } from "../pixel/stamp";
import { applyTheme } from "../pixel/theme-toggle";

export function ProfileForm({ profile, email, timezones }: { profile: Profile; email: string; timezones: string[] }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfile, {});

  useEffect(() => {
    if (state.ok && state.data?.theme) applyTheme(state.data.theme as Theme);
  }, [state]);

  const tzList = timezones.includes(profile.timezone) ? timezones : [profile.timezone, ...timezones];

  return (
    <form action={action} className="flex flex-col gap-4">
      <Stamp trigger={state.stamp} />
      <div>
        <Label htmlFor="email">Correo</Label>
        <input id="email" value={email} readOnly disabled className="field opacity-70" />
      </div>
      <div>
        <Label htmlFor="display_name">Nombre visible</Label>
        <input
          id="display_name"
          name="display_name"
          required
          maxLength={60}
          defaultValue={profile.display_name ?? ""}
          className="field"
        />
        <p className="mt-1 text-sm text-ink-soft">Es lo único tuyo que ven los visitantes de un link público.</p>
        <FieldError errors={state.errors?.display_name} />
      </div>
      <div>
        <Label htmlFor="timezone">Zona horaria</Label>
        <select id="timezone" name="timezone" defaultValue={profile.timezone} className="field">
          {tzList.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-ink-soft">Se usa para enviar los recordatorios a tu hora local.</p>
        <FieldError errors={state.errors?.timezone} />
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Tema</legend>
        <div className="flex flex-wrap gap-4">
          {[
            { v: "system", l: "Como el sistema" },
            { v: "day", l: "Día" },
            { v: "night", l: "Noche con vela" },
          ].map((o) => (
            <label key={o.v} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="theme" value={o.v} defaultChecked={profile.theme === o.v} className="pixel-check" />
              {o.l}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Canales de recordatorio por defecto</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="channel_app"
              defaultChecked={profile.default_reminder_channels.includes("app")}
              className="pixel-check"
            />
            <PixelIcon name="bell" scale={2} /> En la app
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="channel_email"
              defaultChecked={profile.default_reminder_channels.includes("email")}
              className="pixel-check"
            />
            <PixelIcon name="envelope" scale={2} /> Correo
          </label>
        </div>
        <FieldError errors={state.errors?.channel_app} />
      </fieldset>
      <FormMessage message={state.message} ok={state.ok} />
      <SubmitButton icon="check">Guardar perfil</SubmitButton>
    </form>
  );
}

export function DangerZone() {
  const [state, action] = useActionState<ActionState, FormData>(deleteAccount, {});
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-[0.65rem]">Tus datos</h3>
        <p className="mb-3">Descarga todo lo que escribiste en un archivo JSON.</p>
        <a href="/api/export" className={buttonClasses("paper")} download>
          <PixelIcon name="download" scale={2} /> Exportar mis datos
        </a>
      </div>
      <form action={action} className="flex flex-col gap-3 border-t-2 border-dotted border-ink/30 pt-4">
        <h3 className="text-[0.65rem] text-berry">Eliminar cuenta</h3>
        <p>Se borrarán tu cuenta, todos tus libros, fotos y recordatorios. No se puede deshacer.</p>
        <div className="max-w-xs">
          <Label htmlFor="confirm">Escribe BORRAR para confirmar</Label>
          <input id="confirm" name="confirm" autoComplete="off" className="field" />
          <FieldError errors={state.errors?.confirm} />
        </div>
        <FormMessage message={state.message} />
        <SubmitButton variant="berry" icon="trash" pendingText="Borrando…" className="w-fit">
          Eliminar mi cuenta
        </SubmitButton>
      </form>
    </div>
  );
}
