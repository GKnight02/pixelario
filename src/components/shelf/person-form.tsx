"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { createPerson, updatePerson } from "@/lib/actions/people";
import { COVER_COLORS, RELATIONSHIPS } from "@/lib/constants";
import { uploadPhoto } from "@/lib/upload";
import type { Person } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { FieldError, FormMessage, Label, SubmitButton } from "../pixel/form";
import { buttonClasses } from "../pixel/pixel-button";
import { PixelIcon } from "../pixel/pixel-icon";
import { Stamp } from "../pixel/stamp";
import { useCloseOnSuccess } from "../pixel/sheet";

export function ColorPicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? COVER_COLORS[0]);
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Color del lomo</legend>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {COVER_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setValue(c)}
            aria-label={`Color ${c}`}
            aria-pressed={value === c}
            className={`h-9 w-9 border-2 border-ink ${value === c ? "outline-3 outline-offset-2 outline-ink" : ""}`}
            style={{ background: c, boxShadow: "2px 2px 0 0 var(--shadow)" }}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function RelationshipField({ defaultValue }: { defaultValue?: string }) {
  const listId = "relationships";
  return (
    <div>
      <Label htmlFor="relationship">Relación</Label>
      <input
        id="relationship"
        name="relationship"
        list={listId}
        required
        defaultValue={defaultValue ?? "amigo"}
        className="field"
        maxLength={40}
      />
      <datalist id={listId}>
        {RELATIONSHIPS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </div>
  );
}

/** Formulario de libro (nuevo o edición de portada). */
export function PersonForm({
  person,
  avatarUrl,
  onDone,
}: {
  person?: Person;
  avatarUrl?: string | null;
  onDone?: () => void;
}) {
  const [state, action] = useActionState<ActionState, FormData>(person ? updatePerson : createPerson, {});
  useCloseOnSuccess(state.stamp, onDone);
  const id = useMemo(() => person?.id ?? crypto.randomUUID(), [person?.id]);
  const [avatar, setAvatar] = useState(person?.avatar_url ?? "");
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      setAvatar(await uploadPhoto(file, id, "avatar-"));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir");
      setPreview(avatarUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Stamp trigger={state.stamp} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="avatar_url" value={avatar} />

      <div className="flex items-center gap-4">
        <div className="pixel-border-sm flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-paper-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <PixelIcon name="user" scale={5} className="text-ink-soft" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} id="avatar-file" />
          <button type="button" className={buttonClasses("paper", "sm")} onClick={() => fileRef.current?.click()}>
            <PixelIcon name="camera" scale={1.5} />
            {uploading ? "Subiendo…" : avatar ? "Cambiar avatar" : "Avatar (opcional)"}
          </button>
          {avatar ? (
            <button
              type="button"
              className="text-left text-sm underline"
              onClick={() => {
                setAvatar("");
                setPreview(null);
              }}
            >
              Quitar avatar
            </button>
          ) : null}
          {uploadError ? <p className="text-sm text-berry">{uploadError}</p> : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <input id="name" name="name" required maxLength={80} defaultValue={person?.name} className="field" />
          <FieldError errors={state.errors?.name} />
        </div>
        <div>
          <Label htmlFor="nickname" hint="opcional">
            Apodo
          </Label>
          <input id="nickname" name="nickname" maxLength={60} defaultValue={person?.nickname ?? ""} className="field" />
        </div>
      </div>

      <RelationshipField defaultValue={person?.relationship} />

      <div>
        <Label htmlFor="tagline" hint="opcional">
          Frase corta
        </Label>
        <input
          id="tagline"
          name="tagline"
          maxLength={140}
          placeholder="La que siempre llega con pan dulce"
          defaultValue={person?.tagline ?? ""}
          className="field"
        />
      </div>

      <ColorPicker name="cover_color" defaultValue={person?.cover_color} />

      <FormMessage message={state.message} ok={state.ok} />
      <SubmitButton icon={person ? "check" : "books"} pendingText={person ? "Guardando…" : "Encuadernando…"}>
        {person ? "Guardar portada" : "Crear libro"}
      </SubmitButton>
      {uploading ? <p className="text-sm text-ink-soft">Espera a que termine de subir el avatar.</p> : null}
    </form>
  );
}
