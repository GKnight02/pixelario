"use client";

import { useActionState, useEffect, useState } from "react";
import {
  disableShareLink,
  enableShareLink,
  regenerateShareLink,
  saveShareSettings,
} from "@/lib/actions/share";
import { CHAPTERS } from "@/lib/constants";
import type { ShareLink } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { Guide } from "../guides/guide";
import { ActionButton, FieldError, FormMessage, SubmitButton } from "../pixel/form";
import { buttonClasses } from "../pixel/pixel-button";
import { PixelIcon } from "../pixel/pixel-icon";
import { Stamp } from "../pixel/stamp";

export function SharePanel({
  personId,
  personName,
  link,
  siteUrl,
  expiresOn,
}: {
  personId: string;
  personName: string;
  link: ShareLink | null;
  siteUrl: string;
  expiresOn: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveShareSettings, {});
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- capacidad del navegador, solo en cliente
  useEffect(() => setCanShare("share" in navigator), []);
  const active = link?.is_active;
  const url = link ? `${siteUrl}/l/${link.token}` : "";
  const expired = link?.expires_at ? new Date(link.expires_at) <= new Date() : false;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* el usuario puede copiar manualmente */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: `El libro de ${personName}`, url });
    } catch {
      /* cancelado */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Stamp trigger={state.stamp} />
      <div className="pixel-border-sm flex items-start gap-3 bg-accent/25 p-3">
        <PixelIcon name="lock" scale={3} />
        <p>
          <strong>Estás compartiendo información sobre otra persona;</strong> compártelo solo con quien corresponda.
          El link es de solo lectura, no aparece en buscadores y puedes desactivarlo cuando quieras.
        </p>
      </div>

      {!active ? (
        <div className="flex flex-col items-start gap-4">
          <Guide
            animal="rabbit"
            text={
              link
                ? "El link está desactivado. Si lo activas de nuevo, funcionará la misma dirección de antes."
                : "Cuando actives el link, yo recibiré a los visitantes y les explicaré cómo pasar las páginas."
            }
          />
          <form action={enableShareLink}>
            <input type="hidden" name="person_id" value={personId} />
            <ActionButton icon="share" variant="primary" size="md">
              {link ? "Reactivar link" : "Compartir libro"}
            </ActionButton>
          </form>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h3 className="text-[0.65rem]">Link público</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input readOnly value={url} className="field font-mono text-sm" aria-label="Link público" onFocus={(e) => e.target.select()} />
              <div className="flex gap-2">
                <button type="button" onClick={copy} className={buttonClasses("primary")}>
                  <PixelIcon name={copied ? "check" : "link"} scale={2} />
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
                {canShare ? (
                  <button type="button" onClick={nativeShare} className={buttonClasses("paper")} aria-label="Compartir">
                    <PixelIcon name="share" scale={2} />
                  </button>
                ) : null}
              </div>
            </div>
            <p className="flex flex-wrap gap-x-4 text-sm text-ink-soft">
              <span className="flex items-center gap-1">
                <PixelIcon name="eye" scale={1.5} /> {link!.view_count} {link!.view_count === 1 ? "visita" : "visitas"}{" "}
                (solo tú lo ves)
              </span>
              {expired ? <span className="font-semibold text-berry">El link expiró.</span> : null}
            </p>
          </section>

          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="person_id" value={personId} />
            <fieldset>
              <legend className="mb-2 text-[0.65rem] font-title">Capítulos visibles</legend>
              <ul className="grid gap-2 sm:grid-cols-2">
                {CHAPTERS.map((c) => (
                  <li key={c.key}>
                    <label className="pixel-border-sm flex min-h-12 cursor-pointer items-center gap-3 bg-paper px-3">
                      <input
                        type="checkbox"
                        name={c.key}
                        defaultChecked={link!.sections[c.key]}
                        className="pixel-check"
                      />
                      <PixelIcon name={c.icon} scale={2} />
                      <span className="flex-1">{c.title}</span>
                      {c.key === "gifts" ? <span className="text-xs text-ink-soft">¡ojo con las sorpresas!</span> : null}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <p className="text-sm text-ink-soft">
              Las anécdotas marcadas como privadas nunca se muestran, aunque el capítulo sea público.
            </p>
            <div className="max-w-xs">
              <label htmlFor="expires_on" className="mb-1 block text-sm font-semibold">
                Expira el <span className="font-normal text-ink-soft">(opcional)</span>
              </label>
              <input id="expires_on" name="expires_on" type="date" defaultValue={expiresOn} className="field" />
              <FieldError errors={state.errors?.expires_on} />
            </div>
            <FormMessage message={state.message} ok={state.ok} />
            <SubmitButton icon="check">Guardar cambios</SubmitButton>
          </form>

          <section className="flex flex-wrap gap-2 border-t-2 border-dotted border-ink/30 pt-4">
            <form action={regenerateShareLink}>
              <input type="hidden" name="person_id" value={personId} />
              <ActionButton
                icon="link"
                size="md"
                confirm="Se creará un link nuevo y el anterior dejará de funcionar. ¿Continuar?"
              >
                Regenerar link
              </ActionButton>
            </form>
            <form action={disableShareLink}>
              <input type="hidden" name="person_id" value={personId} />
              <ActionButton icon="lock" variant="berry" size="md">
                Desactivar
              </ActionButton>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
