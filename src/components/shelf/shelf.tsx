"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ShelfBook } from "@/lib/data";
import { Azulejo } from "../pixel/azulejo";
import { PixelIcon } from "../pixel/pixel-icon";

type Sort = "name" | "updated" | "birthday";

/** Alto de cada repisa (lomo más alto + aire + canto de la repisa). */
const ROW = 244;
const LEDGE = 14;

/** Contraste simple para el texto del lomo (el color del lomo es fijo, no depende del tema). */
export function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? "#0f1a4d" : "#f2f5fb";
}

function BookSpine({ book, onOpen, opening }: { book: ShelfBook; onOpen: () => void; opening: boolean }) {
  const reduce = useReducedMotion();
  const long = book.name.length > 8;
  const height = 182 + ((book.name.length * 7) % 22) + (long ? 14 : 0);
  const color = textOn(book.cover_color);
  const soon = book.nextBirthdayDays !== null && book.nextBirthdayDays <= 7;
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir el libro de ${book.name}`}
      className="relative flex w-16 flex-col items-center gap-2 self-end border-[3px] border-cobalt-deep px-1 pt-2 pb-2.5"
      style={{
        background: book.cover_color,
        color,
        height,
        boxShadow: "4px 0 0 0 var(--shadow)",
        transformOrigin: "bottom center",
      }}
      whileHover={reduce ? undefined : { y: -8 }}
      whileFocus={reduce ? undefined : { y: -8 }}
      animate={
        opening
          ? reduce
            ? { opacity: 0.5 }
            : { y: [0, -36, -36], rotateZ: [0, -4, -4], rotateY: [0, 0, -35], scale: [1, 1.08, 1.12] }
          : { y: 0, rotateZ: 0, rotateY: 0, scale: 1 }
      }
      transition={
        opening && !reduce
          ? { duration: 0.34, times: [0, 0.55, 1], ease: [0.23, 1, 0.32, 1] }
          : { type: "spring", duration: 0.28, bounce: 0.15 }
      }
    >
      <Azulejo seed={book.name} color={book.cover_color} size={44} />
      <span
        className={`min-h-0 flex-1 overflow-hidden font-display leading-none ${long ? "text-[1.25rem]" : "text-[1.6rem]"}`}
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        <span className="line-clamp-1">{book.name}</span>
      </span>
      {soon ? (
        <span
          className="flex items-center justify-center bg-ochre p-1 text-on-ochre"
          title={`Cumpleaños en ${book.nextBirthdayDays} días`}
        >
          <PixelIcon name="cake" scale={1.5} />
        </span>
      ) : book.avatarSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.avatarSignedUrl}
          alt=""
          className="h-9 w-9 border-2 border-cobalt-deep object-cover"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <span aria-hidden className="h-1.5 w-8 opacity-60" style={{ background: color }} />
      )}
    </motion.button>
  );
}

export function Shelf({ books }: { books: ShelfBook[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [opening, setOpening] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = books.filter(
      (b) =>
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.nickname?.toLowerCase().includes(q) ||
        b.relationship.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => {
      if (sort === "updated") return b.updated_at.localeCompare(a.updated_at);
      if (sort === "birthday") return (a.nextBirthdayDays ?? 9999) - (b.nextBirthdayDays ?? 9999);
      return a.name.localeCompare(b.name, "es");
    });
  }, [books, query, sort]);

  function open(id: string) {
    setOpening(id);
    router.prefetch(`/libro/${id}`);
    setTimeout(() => router.push(`/libro/${id}`), 300);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="mb-1.5 block font-title text-[0.6rem]">
            Buscar
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft">
              <PixelIcon name="search" scale={2} />
            </span>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, apodo o relación"
              className="field pl-10!"
            />
          </div>
        </div>
        <div>
          <label htmlFor="sort" className="mb-1.5 block font-title text-[0.6rem]">
            Ordenar por
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field">
            <option value="name">Nombre</option>
            <option value="updated">Última edición</option>
            <option value="birthday">Próximo cumpleaños</option>
          </select>
        </div>
      </div>

      {/* Pared de azulejos con repisas: los libros se reacomodan en celdas enteras. */}
      <div className="grout border-[3px] border-ink">
        {list.length === 0 ? (
          <p className="px-4 py-14 text-center text-lg">Ningún libro coincide con “{query}”.</p>
        ) : (
          <div
            className="grid justify-start gap-x-3 px-4 sm:px-5"
            style={{
              gridTemplateColumns: "repeat(auto-fill, 4rem)",
              gridAutoRows: ROW,
              paddingTop: 20,
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${ROW - LEDGE}px, var(--ledge) ${ROW - LEDGE}px ${ROW}px)`,
              backgroundPosition: "0 20px",
              backgroundRepeat: "repeat-x",
              backgroundSize: "100% 100%",
            }}
          >
            {list.map((b) => (
              <div
                key={b.id}
                className="relative flex h-full items-end pb-[14px]"
                style={{ perspective: 600, zIndex: opening === b.id ? 10 : undefined }}
              >
                <BookSpine book={b} opening={opening === b.id} onOpen={() => open(b.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-ink-soft">
        {books.length} {books.length === 1 ? "libro" : "libros"}
        {query && list.length !== books.length ? ` · ${list.length} con “${query}”` : ""}
      </p>
    </div>
  );
}
