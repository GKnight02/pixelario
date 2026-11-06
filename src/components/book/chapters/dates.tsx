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
        <ul className="grid gap-5 sm:grid-cols-2">
          {[...items]
            .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999) || a.month - b.month || a.day - b.day)
            .map((d, i) => {
            const icon = DATE_TYPES.find((t) => t.value === d.type)?.icon ?? "calendar";
            const age = d.type === "birthday" ? turningAge(d, d.next ?? null) : null;
            const soon = typeof d.days === "number" && d.days <= 7;
            const featured = i === 0 && typeof d.days === "number";
            return (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: -10, rotateX: 25 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.05, 0.3), ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: "top center" }}
                className={`pixel-border-sm flex flex-col bg-[var(--field)] ${featured ? "sm:col-span-2" : ""}`}
              >
                <div className={`flex items-stretch gap-4 p-4 ${featured ? "sm:p-5" : ""}`}>
                  {/* hoja de calendario de taco */}
                  <div className={`flex shrink-0 flex-col border-[3px] border-ink text-center ${featured ? "w-28" : "w-20"}`}>
                    <div aria-hidden className="flex justify-around bg-ink py-0.5">
                      <span className="h-1.5 w-1.5 bg-paper" />
                      <span className="h-1.5 w-1.5 bg-paper" />
                    </div>
                    <div className="bg-cobalt py-1 font-title text-[0.55rem] text-on-cobalt uppercase">
                      {MONTHS[d.month - 1].slice(0, 3)}
                    </div>
                    <div
                      className={`flex flex-1 items-center justify-center font-display leading-none ${
                        featured ? "py-2 text-[4rem]" : "py-1 text-[2.8rem]"
                      }`}
                    >
                      {d.day}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className={`flex items-center gap-2 font-display leading-none ${featured ? "text-[2.2rem]" : "text-[1.6rem]"}`}>
                      <span className="text-cobalt">
                        <PixelIcon name={icon} scale={2} />
                      </span>
                      {d.label}
                    </p>
                    <p className="mt-1.5 text-ink-soft">
                      {formatDayMonth(d.month, d.day, d.year)}
                      {d.recurring ? " · cada año" : " · única"}
                      {age ? ` · cumple ${age}` : ""}
                    </p>
                    {d.days !== undefined ? (
                      <p className="mt-2">
                        <span
                          className={`inline-block px-2 py-0.5 font-title text-[0.55rem] ${
                            soon ? "bg-ochre text-on-ochre" : "bg-glaze-2 text-ink"
                          }`}
                        >
                          {countdownText(d.days ?? null)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
                {editable && personId ? (
                  <div className="mt-auto flex gap-2 border-t-2 border-dashed border-grout p-2">
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
