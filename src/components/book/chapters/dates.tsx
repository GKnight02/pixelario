"use client";

import { motion } from "motion/react";
import { useActionState, useState } from "react";
import { deleteImportantDate, saveImportantDate } from "@/lib/actions/dates";
import { DATE_TYPES, dateTypeLabel, MONTHS } from "@/lib/constants";
import { countdownText, formatDayMonth, turningAge, type YMD } from "@/lib/dates";
import type { DateType, ImportantDate } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { SleepingCat } from "../../guides/sleeping-cat";
import { ActionButton, FieldError, FormMessage, Label, SubmitButton } from "../../pixel/form";
import { PixelIcon } from "../../pixel/pixel-icon";
import { SheetTrigger, useCloseOnSuccess } from "../../pixel/sheet";
import { Stamp } from "../../pixel/stamp";
import { ChapterHeader } from "./chapter-header";

export type DateRow = Pick<ImportantDate, "id" | "type" | "label" | "month" | "day" | "year" | "recurring"> & {
  remind_days_before?: number[];
  days?: number | null;
  next?: YMD | null;
};

function DateForm({ personId, item, onDone }: { personId: string; item?: DateRow; onDone: () => void }) {
  const [state, action] = useActionState<ActionState, FormData>(saveImportantDate, {});
  useCloseOnSuccess(state.stamp, onDone);
  const [type, setType] = useState<DateType>(item?.type ?? "birthday");
  const [label, setLabel] = useState(item?.label ?? "Cumpleaños");
  const reminders = item?.remind_days_before ?? [7, 0];

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="person_id" value={personId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div>
        <Label htmlFor="d-type">Tipo</Label>
        <select
          id="d-type"
          name="type"
          value={type}
          onChange={(e) => {
            const t = e.target.value as DateType;
            setType(t);
            if (t !== "custom") setLabel(dateTypeLabel(t));
          }}
          className="field"
        >
          {DATE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="d-label">Nombre</Label>
        <input
          id="d-label"
          name="label"
          required
          maxLength={80}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="field"
        />
        <FieldError errors={state.errors?.label} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="d-day">Día</Label>
          <input id="d-day" name="day" type="number" min={1} max={31} required defaultValue={item?.day} className="field" />
        </div>
        <div>
          <Label htmlFor="d-month">Mes</Label>
          <select id="d-month" name="month" defaultValue={item?.month ?? 1} className="field">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="d-year" hint="opc.">
            Año
          </Label>
          <input
            id="d-year"
            name="year"
            type="number"
            min={1900}
            max={2200}
            defaultValue={item?.year ?? ""}
            className="field"
          />
        </div>
      </div>
      <FieldError errors={state.errors?.day ?? state.errors?.year} />
      {type === "birthday" ? (
        <p className="-mt-2 text-sm text-ink-soft">El año es opcional: si no lo sabes, déjalo vacío.</p>
      ) : null}

      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" name="recurring" defaultChecked={item?.recurring ?? true} className="pixel-check" />
        Se repite cada año
      </label>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Recordarme</legend>
        <div className="flex flex-wrap gap-4">
          {[
            { name: "remind_7", n: 7, label: "7 días antes" },
            { name: "remind_1", n: 1, label: "1 día antes" },
            { name: "remind_0", n: 0, label: "El mismo día" },
          ].map((r) => (
            <label key={r.name} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="checkbox" name={r.name} defaultChecked={reminders.includes(r.n)} className="pixel-check" />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <FormMessage message={state.message} />
      <SubmitButton icon="check">{item ? "Guardar fecha" : "Anotar fecha"}</SubmitButton>
    </form>
  );
}

export function DatesChapter({
  items,
  editable,
  personId,
  number,
}: {
  items: DateRow[];
  editable: boolean;
  personId?: string;
  number?: number;
}) {
  const [lastStamp, setLastStamp] = useState<number>();
  const writeButton =
    editable && personId ? (
      <SheetTrigger label="Anotar" title="Nueva fecha importante" icon="cake">
        {(close) => (
          <DateForm
            personId={personId}
            onDone={() => {
              setLastStamp(Date.now());
              close();
            }}
          />
        )}
      </SheetTrigger>
    ) : null;

  return (
    <section>
      <Stamp trigger={lastStamp} />
      <ChapterHeader
        number={number}
        title="Fechas importantes"
        icon="cake"
        subtitle="Cumpleaños, aniversarios y otras fechas"
        action={writeButton}
      />
      {items.length === 0 ? (
        editable ? (
          <SleepingCat suggestion="¿Cuándo es su cumpleaños? Anótalo y te aviso 7 días antes y el mismo día.">
            {writeButton}
          </SleepingCat>
        ) : (
          <p className="py-8 text-center text-ink-soft">No hay fechas anotadas.</p>
        )
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((d, i) => {
            const icon = DATE_TYPES.find((t) => t.value === d.type)?.icon ?? "calendar";
            const age = d.type === "birthday" ? turningAge(d, d.next ?? null) : null;
            const soon = typeof d.days === "number" && d.days <= 7;
            return (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="pixel-border-sm flex flex-col bg-paper"
              >
                <div className="flex items-start gap-3 p-3">
                  {/* hoja de calendario */}
                  <div className="w-16 shrink-0 border-2 border-ink text-center">
                    <div className="bg-berry py-0.5 font-title text-[0.45rem] text-[#fdf6e3] uppercase">
                      {MONTHS[d.month - 1].slice(0, 3)}
                    </div>
                    <div className="py-1 font-title text-base">{d.day}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      <PixelIcon name={icon} scale={1.5} /> {d.label}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {formatDayMonth(d.month, d.day, d.year)}
                      {d.recurring ? " · cada año" : " · única"}
                    </p>
                    {age ? <p className="text-sm">Cumple {age}</p> : null}
                    {d.days !== undefined ? (
                      <p className={`mt-1 font-title text-[0.5rem] ${soon ? "text-berry" : "text-ink-soft"}`}>
                        {countdownText(d.days ?? null)}
                      </p>
                    ) : null}
                  </div>
                </div>
                {editable && personId ? (
                  <div className="mt-auto flex gap-2 border-t-2 border-dotted border-ink/30 p-2">
                    <SheetTrigger title="Editar fecha" label="Editar" icon="pencil" variant="paper" size="sm">
                      {(close) => <DateForm personId={personId} item={d} onDone={close} />}
                    </SheetTrigger>
                    <form action={deleteImportantDate}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="person_id" value={personId} />
                      <ActionButton
                        icon="trash"
                        variant="berry"
                        title="Borrar"
                        confirm={`¿Borrar “${d.label}” y sus recordatorios?`}
                      />
                    </form>
                  </div>
                ) : null}
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
