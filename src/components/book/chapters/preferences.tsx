"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { giftFromPreference } from "@/lib/actions/gifts";
import {
  createCategory,
  deletePreference,
  savePreference,
  togglePreferenceKind,
} from "@/lib/actions/preferences";
import { CATEGORY_ICONS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import type { Category, PreferenceView } from "@/lib/types";
import type { ActionState } from "@/lib/validation/schemas";
import { SleepingCat } from "../../guides/sleeping-cat";
import { Guide } from "../../guides/guide";
import { ActionButton, FieldError, FormMessage, Label, SubmitButton } from "../../pixel/form";
import { Intensity, IntensityInput } from "../../pixel/intensity";
import { buttonClasses } from "../../pixel/pixel-button";
import { PixelIcon } from "../../pixel/pixel-icon";
import { SheetTrigger, useCloseOnSuccess } from "../../pixel/sheet";
import { Stamp } from "../../pixel/stamp";
import { ChapterHeader } from "./chapter-header";

function PreferenceForm({
  personId,
  kind,
  categories: initialCategories,
  item,
  onDone,
}: {
  personId: string;
  kind: "like" | "dislike";
  categories: Category[];
  item?: PreferenceView;
  onDone: () => void;
}) {
  const [state, action] = useActionState<ActionState, FormData>(savePreference, {});
  useCloseOnSuccess(state.stamp, onDone);
  const [categories, setCategories] = useState(initialCategories);
  const [categoryId, setCategoryId] = useState(item?.category_id ?? categories[0]?.id ?? "");
  const [newCat, setNewCat] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState<string>("star");
  const [catError, setCatError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addCategory() {
    const fd = new FormData();
    fd.set("name", catName);
    fd.set("icon", catIcon);
    startTransition(async () => {
      const res = await createCategory({}, fd);
      if (res.ok && res.data) {
        const c = res.data as unknown as Category;
        setCategories((cs) => [...cs, { ...c, owner_id: "me", sort_order: 100 }]);
        setCategoryId(c.id);
        setNewCat(false);
        setCatName("");
      } else {
        setCatError(res.errors?.name?.[0] ?? res.message ?? "Error");
      }
    });
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="person_id" value={personId} />
      <input type="hidden" name="kind" value={kind} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div>
        <Label htmlFor="pref-title">{kind === "like" ? "¿Qué le gusta?" : "¿Qué no le gusta?"}</Label>
        <input
          id="pref-title"
          name="title"
          required
          maxLength={120}
          defaultValue={item?.title}
          placeholder={kind === "like" ? "Café de olla" : "Que lleguen tarde"}
          className="field"
        />
        <FieldError errors={state.errors?.title} />
      </div>

      <div>
        <Label htmlFor="pref-cat">Categoría</Label>
        <div className="flex gap-2">
          <select
            id="pref-cat"
            name="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="field"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={buttonClasses("paper", "sm")}
            onClick={() => setNewCat((v) => !v)}
            aria-expanded={newCat}
            aria-label="Nueva categoría"
            title="Nueva categoría"
          >
            <PixelIcon name="plus" scale={1.5} />
          </button>
        </div>
        {newCat ? (
          <div className="pixel-inset mt-2 flex flex-col gap-2 bg-paper-2 p-3">
            <input
              aria-label="Nombre de la categoría"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              maxLength={40}
              placeholder="Videojuegos"
              className="field"
            />
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Ícono">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={catIcon === icon}
                  aria-label={icon}
                  onClick={() => setCatIcon(icon)}
                  className={`border-2 p-1.5 ${catIcon === icon ? "border-ink bg-accent/40" : "border-transparent"}`}
                >
                  <PixelIcon name={icon} scale={2} />
                </button>
              ))}
            </div>
            {catError ? <p className="text-sm text-berry">{catError}</p> : null}
            <button type="button" disabled={pending || !catName.trim()} onClick={addCategory} className={buttonClasses("leaf", "sm")}>
              {pending ? "Creando…" : "Crear categoría"}
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <Label>Intensidad</Label>
        <IntensityInput name="intensity" kind={kind} defaultValue={item?.intensity ?? 2} />
      </div>

      <div>
        <Label htmlFor="pref-note" hint="opcional">
          Nota
        </Label>
        <textarea
          id="pref-note"
          name="note"
          rows={3}
          maxLength={1000}
          defaultValue={item?.note ?? ""}
          placeholder="Con canela y piloncillo, nunca con azúcar"
          className="field"
        />
      </div>

      <FormMessage message={state.message} />
      <SubmitButton icon="check">{item ? "Guardar cambios" : "Escribir en el libro"}</SubmitButton>
    </form>
  );
}

function PreferenceItem({
  item,
  kind,
  personId,
  categories,
  editable,
  index,
}: {
  item: PreferenceView;
  kind: "like" | "dislike";
  personId?: string;
  categories?: Category[];
  editable: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.24), ease: [0.23, 1, 0.32, 1] }}
      className="border-b-2 border-dashed border-grout last:border-b-0"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex min-h-12 w-full items-center gap-3 px-1 py-2 text-left"
      >
        <span
          aria-hidden
          className={`text-ink-soft transition-transform duration-200 ease-out ${open ? "rotate-90" : ""}`}
        >
          <PixelIcon name="right" scale={1.5} />
        </span>
        <span className="min-w-0 flex-1 text-[1.05rem] font-semibold wrap-break-word group-hover:text-cobalt">
          {item.title}
        </span>
        {item.note ? (
          <span aria-hidden className="text-ink-soft" title="Tiene nota">
            <PixelIcon name="pencil" scale={1.5} />
          </span>
        ) : null}
        <Intensity value={item.intensity} kind={kind} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="mb-3 ml-7 bg-glaze-2 px-4 py-3">
              {item.note ? <p className="whitespace-pre-line">{item.note}</p> : <p className="text-ink-soft">Sin nota.</p>}
              {item.changed_at ? (
                <p className="mt-1 text-sm text-ink-soft">Cambió de opinión el {formatDate(item.changed_at)}.</p>
              ) : null}
              {editable && personId && categories ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <SheetTrigger title="Editar" label="Editar" icon="pencil" variant="paper" size="sm">
                    {(close) => (
                      <PreferenceForm personId={personId} kind={kind} categories={categories} item={item} onDone={close} />
                    )}
                  </SheetTrigger>
                  <form action={togglePreferenceKind}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="person_id" value={personId} />
                    <ActionButton icon={kind === "like" ? "skull" : "heart"}>
                      {kind === "like" ? "Ya no le gusta" : "Ahora le gusta"}
                    </ActionButton>
                  </form>
                  {kind === "like" ? (
                    <form action={giftFromPreference}>
                      <input type="hidden" name="preference_id" value={item.id} />
                      <input type="hidden" name="person_id" value={personId} />
                      <ActionButton icon="gift">Idea de regalo</ActionButton>
                    </form>
                  ) : null}
                  <form action={deletePreference}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="person_id" value={personId} />
                    <ActionButton icon="trash" variant="berry" confirm={`¿Borrar “${item.title}”?`} title="Borrar" />
                  </form>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

export function PreferencesChapter({
  kind,
  items,
  editable,
  personId,
  categories,
  firstTime,
  number,
}: {
  kind: "like" | "dislike";
  items: PreferenceView[];
  editable: boolean;
  personId?: string;
  categories?: Category[];
  firstTime?: boolean;
  number?: number;
}) {
  const [lastStamp, setLastStamp] = useState<number>();
  const [filter, setFilter] = useState<string | null>(null);

  const groups = new Map<string, { icon: string; items: PreferenceView[] }>();
  for (const item of items) {
    const key = item.category_name ?? "Sin categoría";
    if (!groups.has(key)) groups.set(key, { icon: item.category_icon ?? "other", items: [] });
    groups.get(key)!.items.push(item);
  }
  // Lo más intenso arriba dentro de cada categoría; las categorías más llenas primero.
  for (const g of groups.values()) g.items.sort((a, b) => b.intensity - a.intensity);
  const entries = [...groups.entries()].sort((a, b) => b[1].items.length - a[1].items.length);
  const shown = filter ? entries.filter(([name]) => name === filter) : entries;
  const strong = items.filter((it) => it.intensity === 3).length;

  const writeButton =
    editable && personId && categories ? (
      <SheetTrigger
        label="Escribir"
        title={kind === "like" ? "Algo que le gusta" : "Algo que no le gusta"}
        icon="pencil"
      >
        {(close) => (
          <PreferenceForm
            personId={personId}
            kind={kind}
            categories={categories}
            onDone={() => {
              setLastStamp(Date.now());
              close();
            }}
          />
        )}
      </SheetTrigger>
    ) : null;

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const subtitle = items.length
    ? `${plural(items.length, "anotación", "anotaciones")} en ${plural(groups.size, "categoría", "categorías")}${
        strong ? ` · ${strong} ${kind === "like" ? "que le encantan" : "que no soporta"}` : ""
      }`
    : kind === "like"
      ? "Gustos por categoría"
      : "Lo que mejor evitar";

  let i = 0;
  return (
    <section>
      <Stamp trigger={lastStamp} />
      <ChapterHeader
        number={number}
        title={kind === "like" ? "Le gusta" : "No le gusta"}
        icon={kind === "like" ? "heart" : "skull"}
        subtitle={subtitle}
        action={writeButton}
      />

      {firstTime && editable ? (
        <div className="mb-6">
          <Guide
            animal="cat"
            text="¡Tu primer libro está listo! Empieza por algo que le encante: su comida favorita, una canción, un lugar…"
          />
        </div>
      ) : null}

      {items.length === 0 ? (
        editable ? (
          <SleepingCat
            suggestion={
              kind === "like"
                ? "¿Qué pide siempre en un restaurante? ¿Qué canción canta a todo pulmón? Empieza por ahí."
                : "¿Hay algo que no soporta? ¿Una comida, un ruido, una costumbre? Anótalo para no fallar."
            }
          >
            {writeButton}
          </SleepingCat>
        ) : (
          <p className="py-8 text-center text-ink-soft">Este capítulo aún está en blanco.</p>
        )
      ) : (
        <>
          {entries.length > 1 ? (
            <div role="group" aria-label="Filtrar por categoría" className="mb-6 flex flex-wrap gap-2">
              {[null, ...entries.map(([name]) => name)].map((name) => {
                const active = filter === name;
                return (
                  <button
                    key={name ?? "todas"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(name)}
                    className={`flex min-h-9 items-center gap-1.5 border-2 px-2.5 font-title text-[0.55rem] transition-colors duration-150 ${
                      active
                        ? "border-cobalt bg-cobalt text-on-cobalt"
                        : "border-ink bg-[var(--field)] text-ink hover:bg-glaze-2"
                    }`}
                  >
                    {name ? <PixelIcon name={groups.get(name)!.icon} scale={1.5} /> : null}
                    {name ?? "Todas"}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="gap-8 sm:columns-2">
            {shown.map(([name, group]) => (
              <div key={name} className="mb-8 break-inside-avoid">
                <div className="mb-1 flex items-center gap-3 border-b-[3px] border-ink pb-2">
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center ${
                      kind === "like" ? "bg-cobalt text-on-cobalt" : "bg-ink text-paper"
                    }`}
                  >
                    <PixelIcon name={group.icon} scale={2} />
                  </span>
                  <h3 className="flex-1 font-display text-[1.6rem] leading-none tracking-normal [font-size-adjust:none]">
                    {name}
                  </h3>
                  <span className="font-display text-[1.3rem] leading-none text-ink-soft">
                    {group.items.length}
                  </span>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <PreferenceItem
                      key={item.id}
                      item={item}
                      kind={kind}
                      personId={personId}
                      categories={categories}
                      editable={editable}
                      index={i++}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {editable && personId ? (
        <Link
          href={`/libro/${personId}/${kind === "like" ? "disgustos" : "gustos"}`}
          scroll={false}
          className="mt-2 inline-flex items-center gap-2 text-ink-soft underline decoration-2 underline-offset-4 hover:text-cobalt"
        >
          {kind === "like" ? "¿Y lo que no le gusta?" : "Ver lo que sí le gusta"}
          <PixelIcon name="right" scale={1.5} />
        </Link>
      ) : null}
    </section>
  );
}
