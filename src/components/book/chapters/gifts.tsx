"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteGift, giftFromPreference, saveGift, setGiftStatus } from "@/lib/actions/gifts";
import { GIFT_STATUSES, MONTHS } from "@/lib/constants";
import type { GiftIdea, GiftStatus, ImportantDate, Preference } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { Guide } from "../../guides/guide";
import { SleepingCat } from "../../guides/sleeping-cat";
import { ActionButton, FieldError, FormMessage, Label, SubmitButton } from "../../pixel/form";
import { buttonClasses } from "../../pixel/pixel-button";
import { PixelIcon } from "../../pixel/pixel-icon";
import { SheetTrigger, useCloseOnSuccess } from "../../pixel/sheet";
import { Stamp } from "../../pixel/stamp";
import { ChapterHeader } from "./chapter-header";

type GiftRow = Pick<GiftIdea, "id" | "title" | "price_estimate" | "url" | "note" | "status"> &
  Partial<Pick<GiftIdea, "preference_id" | "date_id">>;
type LikeOpt = Pick<Preference, "id" | "title" | "intensity">;
type DateOpt = Pick<ImportantDate, "id" | "label" | "month" | "day">;

const STATUS_STYLE: Record<GiftStatus, string> = {
  idea: "bg-paper-2",
  bought: "bg-accent/40",
  given: "bg-leaf/30",
};

function formatPrice(n: number | null) {
  if (n === null || n === undefined) return null;
  return new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(n);
}

function GiftForm({
  personId,
  item,
  likes,
  dates,
  onDone,
}: {
  personId: string;
  item?: GiftRow;
  likes: LikeOpt[];
  dates: DateOpt[];
  onDone: (state: ActionState) => void;
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveGift, {});
  useCloseOnSuccess(state.stamp, () => onDone(state));

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="person_id" value={personId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div>
        <Label htmlFor="g-title">Idea</Label>
        <input id="g-title" name="title" required maxLength={120} defaultValue={item?.title} className="field" />
        <FieldError errors={state.errors?.title} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="g-price" hint="aprox.">
            Precio
          </Label>
          <input
            id="g-price"
            name="price_estimate"
            inputMode="decimal"
            defaultValue={item?.price_estimate ?? ""}
            className="field"
          />
          <FieldError errors={state.errors?.price_estimate} />
        </div>
        <div>
          <Label htmlFor="g-status">Estado</Label>
          <select id="g-status" name="status" defaultValue={item?.status ?? "idea"} className="field">
            {GIFT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="g-url" hint="opcional">
          Link
        </Label>
        <input id="g-url" name="url" type="url" defaultValue={item?.url ?? ""} placeholder="https://" className="field" />
        <FieldError errors={state.errors?.url} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="g-pref">Viene de su gusto</Label>
          <select id="g-pref" name="preference_id" defaultValue={item?.preference_id ?? ""} className="field">
            <option value="">—</option>
            {likes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="g-date">Para la fecha</Label>
          <select id="g-date" name="date_id" defaultValue={item?.date_id ?? ""} className="field">
            <option value="">—</option>
            {dates.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} ({d.day} {MONTHS[d.month - 1].slice(0, 3)})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="g-note" hint="opcional">
          Nota
        </Label>
        <textarea id="g-note" name="note" rows={3} maxLength={1000} defaultValue={item?.note ?? ""} className="field" />
      </div>
      <FormMessage message={state.message} />
      <SubmitButton icon="gift">{item ? "Guardar idea" : "Anotar idea"}</SubmitButton>
    </form>
  );
}

export function GiftsChapter({
  items,
  editable,
  personId,
  likes = [],
  dates = [],
  number,
}: {
  items: GiftRow[];
  editable: boolean;
  personId?: string;
  likes?: LikeOpt[];
  dates?: DateOpt[];
  number?: number;
}) {
  const [lastStamp, setLastStamp] = useState<number>();
  const [givenTitle, setGivenTitle] = useState<string | null>(null);

  const linked = new Set(items.map((g) => g.preference_id).filter(Boolean));
  const suggestions = likes.filter((l) => !linked.has(l.id)).slice(0, 3);
  const likeTitle = (id?: string | null) => likes.find((l) => l.id === id)?.title;
  const dateLabel = (id?: string | null) => dates.find((d) => d.id === id)?.label;

  const onSaved = (close: () => void) => (state: ActionState) => {
    setLastStamp(Date.now());
    if (state.data?.status === "given") setGivenTitle(String(state.data.title));
    close();
  };

  const writeButton =
    editable && personId ? (
      <SheetTrigger label="Anotar" title="Nueva idea de regalo" icon="gift">
        {(close) => <GiftForm personId={personId} likes={likes} dates={dates} onDone={onSaved(close)} />}
      </SheetTrigger>
    ) : null;

  return (
    <section>
      <Stamp trigger={lastStamp} />
      <ChapterHeader
        number={number}
        title="Ideas de regalo"
        icon="gift"
        subtitle={editable ? "Nunca se muestran en el link público por defecto" : undefined}
        action={writeButton}
      />

      {givenTitle && personId ? (
        <div className="mb-5">
          <Guide animal="fox" text={`¡Regalaste “${givenTitle}”! ¿Quieres guardar ese momento como anécdota?`}>
            <Link
              href={`/libro/${personId}/anecdotas?nueva=${encodeURIComponent(`Le regalé ${givenTitle}`)}`}
              className={buttonClasses("primary", "sm")}
            >
              <PixelIcon name="camera" scale={1.5} /> Crear anécdota
            </Link>
          </Guide>
        </div>
      ) : editable && personId && suggestions.length > 0 ? (
        <div className="mb-5">
          <Guide
            animal="fox"
            storageKey={`fox-gifts-${personId}`}
            text="Traigo ideas de su capítulo “Le gusta”. ¿Convierto alguna en idea de regalo?"
          >
            {suggestions.map((s) => (
              <form key={s.id} action={giftFromPreference}>
                <input type="hidden" name="preference_id" value={s.id} />
                <input type="hidden" name="person_id" value={personId} />
                <ActionButton icon="gift" variant="paper">
                  {s.title}
                </ActionButton>
              </form>
            ))}
          </Guide>
        </div>
      ) : null}

      {items.length === 0 ? (
        editable ? (
          <SleepingCat suggestion="¿Mencionó algo que quería? Anótalo antes de que se te olvide.">{writeButton}</SleepingCat>
        ) : (
          <p className="py-8 text-center text-ink-soft">No hay ideas de regalo.</p>
        )
      ) : (
        <div className="flex flex-col gap-5">
          {GIFT_STATUSES.map((status) => {
            const list = items.filter((g) => g.status === status.value);
            if (list.length === 0) return null;
            return (
              <div key={status.value}>
                <h3 className="mb-2 text-[0.6rem] text-ink-soft">
                  {status.label} ({list.length})
                </h3>
                <ul className="flex flex-col gap-2">
                  {list.map((g, i) => (
                    <motion.li
                      key={g.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`pixel-border-sm p-3 ${STATUS_STYLE[g.status]}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`font-semibold ${g.status === "given" ? "line-through decoration-2" : ""}`}>
                            {g.title}
                          </p>
                          <p className="flex flex-wrap gap-x-3 text-sm text-ink-soft">
                            {formatPrice(g.price_estimate) ? <span>≈ {formatPrice(g.price_estimate)}</span> : null}
                            {likeTitle(g.preference_id) ? (
                              <span className="flex items-center gap-1">
                                <PixelIcon name="heart" scale={1} /> {likeTitle(g.preference_id)}
                              </span>
                            ) : null}
                            {dateLabel(g.date_id) ? (
                              <span className="flex items-center gap-1">
                                <PixelIcon name="cake" scale={1} /> {dateLabel(g.date_id)}
                              </span>
                            ) : null}
                          </p>
                          {g.note ? <p className="mt-1 whitespace-pre-line">{g.note}</p> : null}
                          {g.url ? (
                            <a
                              href={g.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="mt-1 inline-flex items-center gap-1 text-sm underline"
                            >
                              <PixelIcon name="link" scale={1.5} /> Ver enlace
                            </a>
                          ) : null}
                        </div>
                        {editable && personId ? (
                          <div className="flex flex-wrap gap-1.5">
                            {g.status === "idea" ? (
                              <form action={setGiftStatus}>
                                <input type="hidden" name="id" value={g.id} />
                                <input type="hidden" name="person_id" value={personId} />
                                <input type="hidden" name="status" value="bought" />
                                <ActionButton icon="check">Comprado</ActionButton>
                              </form>
                            ) : null}
                            {g.status !== "given" ? (
                              <form
                                action={async (fd) => {
                                  await setGiftStatus(fd);
                                  setGivenTitle(g.title);
                                }}
                              >
                                <input type="hidden" name="id" value={g.id} />
                                <input type="hidden" name="person_id" value={personId} />
                                <input type="hidden" name="status" value="given" />
                                <ActionButton icon="gift" variant="leaf">
                                  Regalado
                                </ActionButton>
                              </form>
                            ) : null}
                            <SheetTrigger title="Editar idea" icon="pencil" variant="paper" size="sm" ariaLabel="Editar">
                              {(close) => (
                                <GiftForm
                                  personId={personId}
                                  item={g}
                                  likes={likes}
                                  dates={dates}
                                  onDone={onSaved(close)}
                                />
                              )}
                            </SheetTrigger>
                            <form action={deleteGift}>
                              <input type="hidden" name="id" value={g.id} />
                              <input type="hidden" name="person_id" value={personId} />
                              <ActionButton icon="trash" variant="berry" title="Borrar" confirm={`¿Borrar “${g.title}”?`} />
                            </form>
                          </div>
                        ) : null}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
