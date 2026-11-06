"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { deleteAnecdote, saveAnecdote } from "@/lib/actions/anecdotes";
import { getMood, MAX_PHOTOS, MOODS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { uploadPhoto } from "@/lib/upload";
import type { AnecdoteView } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { SleepingCat } from "../../guides/sleeping-cat";
import { ActionButton, FieldError, FormMessage, Label, SubmitButton } from "../../pixel/form";
import { buttonClasses } from "../../pixel/pixel-button";
import { PixelIcon } from "../../pixel/pixel-icon";
import { Sheet, SheetTrigger, useCloseOnSuccess } from "../../pixel/sheet";
import { Stamp } from "../../pixel/stamp";
import { ChapterHeader } from "./chapter-header";

const PIXEL_KEY = "pixelario-pixel-thumbs";

/** Miniatura con filtro pixelado: se dibuja a 20 px y se escala sin suavizado. */
function PixelThumb({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, c.width, c.height);
    };
    img.src = src;
  }, [src]);
  return (
    <canvas
      ref={ref}
      width={20}
      height={20}
      role="img"
      aria-label={alt}
      className="pixelated h-full w-full"
    />
  );
}

function MoodStamp({ mood }: { mood: string | null }) {
  const m = getMood(mood);
  if (!m) return null;
  return (
    <span
      className="inline-flex -rotate-3 items-center gap-1 border-2 px-1.5 py-0.5 font-title text-[0.45rem] uppercase"
      style={{ color: m.color, borderColor: m.color }}
    >
      <PixelIcon name={m.icon} scale={1.5} /> {m.label}
    </span>
  );
}

function AnecdoteForm({
  personId,
  item,
  onDone,
  defaults,
}: {
  personId: string;
  item?: AnecdoteView;
  onDone: () => void;
  defaults?: { title?: string };
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveAnecdote, {});
  useCloseOnSuccess(state.stamp, onDone);
  const [photos, setPhotos] = useState<{ path: string; url: string }[]>(
    item ? item.photos.map((p, i) => ({ path: p, url: item.photoUrls[i]?.thumb ?? "" })) : [],
  );
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    setUploadError(null);
    setUploading((n) => n + files.length);
    await Promise.all(
      files.map(async (file) => {
        try {
          const path = await uploadPhoto(file, personId);
          setPhotos((ps) => [...ps, { path, url: URL.createObjectURL(file) }]);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Error al subir");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="person_id" value={personId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="photos" value={JSON.stringify(photos.map((p) => p.path))} />

      <div>
        <Label htmlFor="a-title">Título</Label>
        <input
          id="a-title"
          name="title"
          required
          maxLength={120}
          defaultValue={item?.title ?? defaults?.title}
          placeholder="El día que se perdió en el mercado"
          className="field"
        />
        <FieldError errors={state.errors?.title} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="a-date" hint="opcional">
            Fecha
          </Label>
          <input id="a-date" name="happened_on" type="date" defaultValue={item?.happened_on ?? ""} className="field" />
        </div>
        <div>
          <Label htmlFor="a-place" hint="opcional">
            Lugar
          </Label>
          <input id="a-place" name="place" maxLength={120} defaultValue={item?.place ?? ""} className="field" />
        </div>
      </div>

      <div>
        <Label htmlFor="a-body">¿Qué pasó?</Label>
        <textarea id="a-body" name="body" rows={5} maxLength={5000} defaultValue={item?.body ?? ""} className="field" />
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Sticker</legend>
        <div className="flex flex-wrap gap-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 pr-2">
            <input type="radio" name="mood" value="" defaultChecked={!item?.mood} className="pixel-check" />
            Ninguno
          </label>
          {MOODS.map((m) => (
            <label key={m.value} className="flex min-h-11 cursor-pointer items-center gap-2 pr-2">
              <input
                type="radio"
                name="mood"
                value={m.value}
                defaultChecked={item?.mood === m.value}
                className="pixel-check"
              />
              <span style={{ color: m.color }}>
                <PixelIcon name={m.icon} scale={2} />
              </span>
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="mb-1 text-sm font-semibold">
          Fotos <span className="font-normal text-ink-soft">(hasta {MAX_PHOTOS}, máx. 5 MB c/u)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.path} className="relative h-20 w-20 border-2 border-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((ps) => ps.filter((x) => x.path !== p.path))}
                aria-label="Quitar foto"
                className="absolute -top-2 -right-2 border-2 border-ink bg-terra p-0.5 text-on-cobalt"
              >
                <PixelIcon name="x" scale={1.5} />
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div key={i} className="flex h-20 w-20 animate-pulse items-center justify-center border-2 border-dashed border-ink">
              <PixelIcon name="hourglass" scale={2} />
            </div>
          ))}
          {photos.length + uploading < MAX_PHOTOS ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={onFiles} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 border-2 border-dashed border-ink text-sm"
              >
                <PixelIcon name="camera" scale={2} />
                Añadir
              </button>
            </>
          ) : null}
        </div>
        {uploadError ? <p className="mt-1 text-sm text-berry">{uploadError}</p> : null}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" name="is_private" defaultChecked={item?.is_private} className="pixel-check" />
        <PixelIcon name="lock" scale={2} />
        Privado: no se muestra en el link público
      </label>

      <FormMessage message={state.message} />
      <SubmitButton icon="check" pendingText="Guardando…">
        {uploading > 0 ? "Esperando fotos…" : item ? "Guardar recuerdo" : "Escribir recuerdo"}
      </SubmitButton>
    </form>
  );
}

function AnecdoteEntry({
  item,
  index,
  editable,
  personId,
  pixelThumbs,
}: {
  item: AnecdoteView;
  index: number;
  editable: boolean;
  personId?: string;
  pixelThumbs: boolean;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);

  return (
    <motion.li
      className="relative pl-10"
      initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.06, 0.36), ease: [0.23, 1, 0.32, 1] }}
    >
      {/* sello en la línea de tiempo */}
      <span
        aria-hidden
        className="absolute top-3 left-[7px] h-5 w-5 rotate-45 border-[3px] border-ink"
        style={{ background: getMood(item.mood)?.color ?? "var(--accent)" }}
      />
      <article className="pixel-border-sm bg-[var(--field)]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full flex-col gap-1 p-3 text-left"
        >
          <span className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            {item.happened_on ? <span>{formatDate(item.happened_on)}</span> : null}
            {item.place ? (
              <span className="flex items-center gap-1">
                <PixelIcon name="places" scale={1.5} /> {item.place}
              </span>
            ) : null}
            {item.is_private ? (
              <span className="flex items-center gap-1" title="Privado">
                <PixelIcon name="lock" scale={1.5} /> privado
              </span>
            ) : null}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-[1.7rem] leading-none">{item.title}</h4>
            <MoodStamp mood={item.mood} />
          </span>
          {!open && item.body ? <span className="line-clamp-2">{item.body}</span> : null}
          {item.photoUrls.length > 0 && !open ? (
            <span className="mt-1 flex gap-1.5">
              {item.photoUrls.map((p, i) => (
                <span key={i} className="h-14 w-14 overflow-hidden border-2 border-ink">
                  {pixelThumbs ? (
                    <PixelThumb src={p.thumb} alt={`Foto ${i + 1}`} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumb} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  )}
                </span>
              ))}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className="border-t-2 border-dashed border-grout p-3">
            {item.body ? <p className="mb-3 whitespace-pre-line">{item.body}</p> : null}
            {item.photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {item.photoUrls.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhoto(i)}
                    className="aspect-square overflow-hidden border-2 border-ink"
                    aria-label={`Ver foto ${i + 1} en grande`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumb} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
            {editable && personId ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <SheetTrigger title="Editar recuerdo" label="Editar" icon="pencil" variant="paper" size="sm">
                  {(close) => <AnecdoteForm personId={personId} item={item} onDone={close} />}
                </SheetTrigger>
                <form action={deleteAnecdote}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="person_id" value={personId} />
                  <ActionButton icon="trash" variant="berry" confirm={`¿Borrar “${item.title}”?`}>
                    Borrar
                  </ActionButton>
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      <Sheet open={photo !== null} onClose={() => setPhoto(null)} title={item.title}>
        {photo !== null ? (
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photoUrls[photo].full} alt={`Foto ${photo + 1} de ${item.title}`} className="w-full border-2 border-ink" />
            {item.photoUrls.length > 1 ? (
              <div className="flex justify-between">
                <button
                  type="button"
                  className={buttonClasses("paper", "sm")}
                  onClick={() => setPhoto((p) => (p! - 1 + item.photoUrls.length) % item.photoUrls.length)}
                >
                  <PixelIcon name="left" scale={1.5} /> Anterior
                </button>
                <button
                  type="button"
                  className={buttonClasses("paper", "sm")}
                  onClick={() => setPhoto((p) => (p! + 1) % item.photoUrls.length)}
                >
                  Siguiente <PixelIcon name="right" scale={1.5} />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </motion.li>
  );
}

export function AnecdotesChapter({
  items,
  editable,
  personId,
  number,
  prefill,
}: {
  items: AnecdoteView[];
  editable: boolean;
  personId?: string;
  number?: number;
  /** Abre el formulario con un título sugerido (p. ej. tras marcar un regalo como regalado). */
  prefill?: string;
}) {
  const [lastStamp, setLastStamp] = useState<number>();
  const [pixelThumbs, setPixelThumbs] = useState(false);
  const [prefillOpen, setPrefillOpen] = useState(Boolean(prefill && editable));

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preferencia guardada en el navegador
      setPixelThumbs(localStorage.getItem(PIXEL_KEY) === "1");
    } catch {}
  }, []);

  const togglePixel = () => {
    setPixelThumbs((v) => {
      try {
        localStorage.setItem(PIXEL_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
  };

  const byYear = new Map<string, AnecdoteView[]>();
  for (const a of items) {
    const y = a.happened_on ? a.happened_on.slice(0, 4) : "Sin fecha";
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(a);
  }

  const onSaved = (close: () => void) => () => {
    setLastStamp(Date.now());
    close();
  };

  const writeButton =
    editable && personId ? (
      <SheetTrigger label="Escribir" title="Nuevo recuerdo" icon="pencil">
        {(close) => <AnecdoteForm personId={personId} onDone={onSaved(close)} />}
      </SheetTrigger>
    ) : null;

  let i = 0;
  return (
    <section>
      <Stamp trigger={lastStamp} />
      <ChapterHeader
        number={number}
        title="Anécdotas"
        icon="camera"
        subtitle="Una línea de tiempo de recuerdos"
        action={
          <div className="flex flex-wrap gap-2">
            {items.some((a) => a.photoUrls.length) ? (
              <button
                type="button"
                onClick={togglePixel}
                aria-pressed={pixelThumbs}
                className={buttonClasses(pixelThumbs ? "primary" : "paper", "sm")}
              >
                <PixelIcon name="camera" scale={1.5} /> Pixelar fotos
              </button>
            ) : null}
            {writeButton}
          </div>
        }
      />

      {editable && personId && prefill ? (
        <Sheet open={prefillOpen} onClose={() => setPrefillOpen(false)} title="Nuevo recuerdo">
          <AnecdoteForm
            personId={personId}
            defaults={{ title: prefill }}
            onDone={() => {
              setLastStamp(Date.now());
              setPrefillOpen(false);
            }}
          />
        </Sheet>
      ) : null}

      {items.length === 0 ? (
        editable ? (
          <SleepingCat suggestion="¿Cómo se conocieron? ¿Cuál fue su viaje más divertido? Escribe el primer recuerdo.">
            {writeButton}
          </SleepingCat>
        ) : (
          <p className="py-8 text-center text-ink-soft">Aún no hay recuerdos compartidos.</p>
        )
      ) : (
        <div className="flex flex-col gap-10">
          {[...byYear.entries()].map(([year, list]) => (
            <div key={year} className="relative">
              <h3 className="mb-4 flex items-baseline gap-3 font-display leading-none tracking-normal [font-size-adjust:none]">
                <span className="text-[3rem] text-cobalt">{year}</span>
                <span className="text-[1.2rem] text-ink-soft">
                  {list.length} {list.length === 1 ? "recuerdo" : "recuerdos"}
                </span>
              </h3>
              <ol className="relative flex flex-col gap-4">
                <motion.span
                  aria-hidden
                  className="absolute top-0 bottom-0 left-[15px] w-1 origin-top bg-cobalt"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                />
                {list.map((a) => (
                  <AnecdoteEntry
                    key={a.id}
                    item={a}
                    index={i++}
                    editable={editable}
                    personId={personId}
                    pixelThumbs={pixelThumbs}
                  />
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
      {!editable ? null : (
        <p className="mt-6 text-sm text-ink-soft">
          Los recuerdos marcados como privados nunca aparecen en el{" "}
          <Link href={`/libro/${personId}/compartir`} className="underline">
            link público
          </Link>
          .
        </p>
      )}
    </section>
  );
}
