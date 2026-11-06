"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  completeReminder,
  deleteReminder,
  postponeReminder,
  reopenReminder,
  saveReminder,
} from "@/lib/actions/reminders";
import { REPEATS } from "@/lib/constants";
import { formatDateTime, toDateTimeLocal } from "@/lib/dates";
import type { Channel, Person, Reminder } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { Guide } from "../../guides/guide";
import { SleepingCat } from "../../guides/sleeping-cat";
import { ActionButton, FieldError, FormMessage, Label, SubmitButton } from "../../pixel/form";
import { PixelIcon } from "../../pixel/pixel-icon";
import { SheetTrigger, useCloseOnSuccess } from "../../pixel/sheet";
import { Stamp } from "../../pixel/stamp";
import { ChapterHeader } from "./chapter-header";

export type ReminderRow = Pick<Reminder, "id" | "title" | "note" | "due_at" | "repeat"> &
  Partial<Pick<Reminder, "channels" | "done_at" | "person_id" | "date_id">> & {
    person?: Pick<Person, "id" | "name" | "cover_color"> | null;
  };

function ReminderForm({
  item,
  personId,
  people,
  timezone,
  defaultChannels,
  onDone,
}: {
  item?: ReminderRow;
  personId?: string;
  people?: Pick<Person, "id" | "name">[];
  timezone: string;
  defaultChannels: Channel[];
  onDone: () => void;
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveReminder, {});
  useCloseOnSuccess(state.stamp, onDone);
  const channels = item?.channels ?? defaultChannels;
  const [defaultDue] = useState(() =>
    toDateTimeLocal(item?.due_at ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString(), timezone),
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {personId ? <input type="hidden" name="person_id" value={personId} /> : null}

      <div>
        <Label htmlFor="r-title">¿Qué hay que recordar?</Label>
        <input id="r-title" name="title" required maxLength={160} defaultValue={item?.title} className="field" />
        <FieldError errors={state.errors?.title} />
      </div>

      {!personId && people ? (
        <div>
          <Label htmlFor="r-person" hint="opcional">
            Persona
          </Label>
          <select id="r-person" name="person_id" defaultValue={item?.person_id ?? ""} className="field">
            <option value="">— Recordatorio general —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="r-due">Fecha y hora</Label>
          <input id="r-due" name="due_local" type="datetime-local" required defaultValue={defaultDue} className="field" />
          <FieldError errors={state.errors?.due_local} />
          <p className="mt-1 text-xs text-ink-soft">Zona: {timezone.replace(/_/g, " ")}</p>
        </div>
        <div>
          <Label htmlFor="r-repeat">Repetición</Label>
          <select id="r-repeat" name="repeat" defaultValue={item?.repeat ?? "none"} className="field">
            {REPEATS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="r-note" hint="opcional">
          Nota
        </Label>
        <textarea id="r-note" name="note" rows={3} maxLength={1000} defaultValue={item?.note ?? ""} className="field" />
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Avisarme por</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input type="checkbox" name="channel_app" defaultChecked={channels.includes("app")} className="pixel-check" />
            <PixelIcon name="bell" scale={2} /> En la app
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="channel_email"
              defaultChecked={channels.includes("email")}
              className="pixel-check"
            />
            <PixelIcon name="envelope" scale={2} /> Correo
          </label>
        </div>
        <FieldError errors={state.errors?.channel_app} />
      </fieldset>

      <FormMessage message={state.message} />
      <SubmitButton icon="bell">{item ? "Guardar" : "Crear recordatorio"}</SubmitButton>
    </form>
  );
}

function ReminderItem({
  r,
  timezone,
  editable,
  showPerson,
  people,
  defaultChannels,
  overdue,
}: {
  r: ReminderRow;
  timezone: string;
  editable: boolean;
  showPerson?: boolean;
  people?: Pick<Person, "id" | "name">[];
  defaultChannels: Channel[];
  overdue?: boolean;
}) {
  return (
    <li
      className={`pixel-border-sm flex gap-4 p-3 sm:p-4 ${
        r.done_at ? "bg-glaze-2 opacity-75" : "bg-[var(--field)]"
      }`}
    >
      {/* bloque de fecha */}
      <div
        aria-hidden
        className={`flex w-16 shrink-0 flex-col items-center justify-center border-[3px] border-ink py-1 ${
          overdue ? "bg-ochre text-on-ochre" : "bg-glaze-2"
        }`}
      >
        <span className="font-display text-[2.2rem] leading-none">
          {new Intl.DateTimeFormat("es", { timeZone: timezone, day: "numeric" }).format(new Date(r.due_at))}
        </span>
        <span className="font-title text-[0.5rem] uppercase">
          {new Intl.DateTimeFormat("es", { timeZone: timezone, month: "short" }).format(new Date(r.due_at)).replace(".", "")}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`flex flex-wrap items-center gap-2 text-[1.05rem] font-semibold ${r.done_at ? "line-through" : ""}`}>
            {r.title}
            {overdue ? (
              <span className="bg-ochre px-1.5 py-0.5 font-title text-[0.5rem] text-on-ochre no-underline">vencido</span>
            ) : null}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-soft">
            <span className="flex items-center gap-1">
              <PixelIcon name="clock" scale={1.5} /> {formatDateTime(r.due_at, timezone)}
            </span>
            {r.repeat !== "none" ? <span>{REPEATS.find((x) => x.value === r.repeat)?.label}</span> : null}
            {r.channels?.includes("email") ? (
              <span title="También por correo">
                <PixelIcon name="envelope" scale={1.5} />
              </span>
            ) : null}
            {showPerson && r.person ? (
              <Link href={`/libro/${r.person.id}/recordatorios`} className="flex items-center gap-1 underline">
                <span className="inline-block h-3 w-3 border border-ink" style={{ background: r.person.cover_color }} />
                {r.person.name}
              </Link>
            ) : null}
          </p>
          {r.note ? <p className="mt-1 whitespace-pre-line">{r.note}</p> : null}
        </div>
        {editable ? (
          <div className="flex flex-wrap gap-1.5">
            {r.done_at ? (
              <form action={reopenReminder}>
                <input type="hidden" name="id" value={r.id} />
                <ActionButton icon="left">Reabrir</ActionButton>
              </form>
            ) : (
              <>
                <form action={completeReminder}>
                  <input type="hidden" name="id" value={r.id} />
                  <ActionButton icon="check" variant="leaf">
                    Hecho
                  </ActionButton>
                </form>
                {overdue ? (
                  <form action={postponeReminder}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="hours" value="24" />
                    <ActionButton icon="hourglass">Mañana</ActionButton>
                  </form>
                ) : null}
              </>
            )}
            <SheetTrigger title="Editar recordatorio" icon="pencil" variant="paper" size="sm" ariaLabel="Editar">
              {(close) => (
                <ReminderForm
                  item={r}
                  personId={showPerson ? undefined : r.person_id ?? undefined}
                  people={people}
                  timezone={timezone}
                  defaultChannels={defaultChannels}
                  onDone={close}
                />
              )}
            </SheetTrigger>
            <form action={deleteReminder}>
              <input type="hidden" name="id" value={r.id} />
              <ActionButton icon="trash" variant="berry" title="Borrar" confirm={`¿Borrar “${r.title}”?`} />
            </form>
          </div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Lista de recordatorios: vencidos (bandeja del zorro), próximos y hechos.
 * `now` llega del servidor para que la clasificación coincida al hidratar.
 */
export function RemindersList({
  items,
  timezone,
  now,
  editable,
  personId,
  people,
  defaultChannels = ["app", "email"],
  number,
  global = false,
}: {
  items: ReminderRow[];
  timezone: string;
  now: string;
  editable: boolean;
  personId?: string;
  people?: Pick<Person, "id" | "name">[];
  defaultChannels?: Channel[];
  number?: number;
  global?: boolean;
}) {
  const [lastStamp, setLastStamp] = useState<number>();
  const [showDone, setShowDone] = useState(false);

  const pending = items.filter((r) => !r.done_at);
  const nowMs = new Date(now).getTime();
  const overdue = pending.filter((r) => new Date(r.due_at).getTime() <= nowMs);
  const upcoming = pending.filter((r) => new Date(r.due_at).getTime() > nowMs);
  const done = items.filter((r) => r.done_at);

  const writeButton = editable ? (
    <SheetTrigger label="Nuevo" title="Nuevo recordatorio" icon="bell">
      {(close) => (
        <ReminderForm
          personId={personId}
          people={people}
          timezone={timezone}
          defaultChannels={defaultChannels}
          onDone={() => {
            setLastStamp(Date.now());
            close();
          }}
        />
      )}
    </SheetTrigger>
  ) : null;

  const common = { timezone, editable, people, defaultChannels, showPerson: global };

  return (
    <section>
      <Stamp trigger={lastStamp} />
      <ChapterHeader
        number={number}
        title={global ? "Bandeja de recordatorios" : "Recordatorios"}
        icon="bell"
        subtitle={global ? "Todo lo que el zorro tiene que entregarte" : "Tareas con fecha para esta persona"}
        action={writeButton}
      />

      {editable && overdue.length > 0 ? (
        <div className="mb-5">
          <Guide
            animal="fox"
            state="special"
            text={`¡Traigo ${overdue.length} ${overdue.length === 1 ? "aviso" : "avisos"} para ti! Márcalos como hechos o pospónlos.`}
          />
        </div>
      ) : null}

      {items.length === 0 ? (
        editable ? (
          <SleepingCat suggestion="¿Llamarle el domingo? ¿Devolverle el libro? Crea un recordatorio y el zorro te avisará.">
            {writeButton}
          </SleepingCat>
        ) : (
          <p className="py-8 text-center text-ink-soft">No hay recordatorios.</p>
        )
      ) : (
        <div className="flex flex-col gap-8">
          {overdue.length > 0 ? (
            <div>
              <h3 className="mb-3 border-b-[3px] border-ink pb-2 font-display text-[1.6rem] leading-none tracking-normal [font-size-adjust:none]">
                Pendientes <span className="text-ink-soft">{overdue.length}</span>
              </h3>
              <ul className="flex flex-col gap-3">
                {overdue.map((r) => (
                  <ReminderItem key={r.id} r={r} overdue {...common} />
                ))}
              </ul>
            </div>
          ) : null}
          {upcoming.length > 0 ? (
            <div>
              <h3 className="mb-3 border-b-[3px] border-ink pb-2 font-display text-[1.6rem] leading-none tracking-normal [font-size-adjust:none]">
                Próximos <span className="text-ink-soft">{upcoming.length}</span>
              </h3>
              <ul className="flex flex-col gap-3">
                {upcoming.map((r) => (
                  <ReminderItem key={r.id} r={r} {...common} />
                ))}
              </ul>
            </div>
          ) : null}
          {done.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="mb-2 flex items-center gap-2 text-[0.6rem] font-title text-ink-soft"
              >
                <PixelIcon name={showDone ? "x" : "plus"} scale={1.5} /> Hechos ({done.length})
              </button>
              {showDone ? (
                <ul className="flex flex-col gap-3">
                  {done.map((r) => (
                    <ReminderItem key={r.id} r={r} {...common} />
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
