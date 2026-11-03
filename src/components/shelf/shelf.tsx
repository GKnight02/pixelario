"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ShelfBook } from "@/lib/data";
import { PixelIcon } from "../pixel/pixel-icon";

type Sort = "name" | "updated" | "birthday";

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Contraste simple para el texto del lomo. */
function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? "#2a1a10" : "#fdf6e3";
}

function BookSpine({ book, onOpen, opening }: { book: ShelfBook; onOpen: () => void; opening: boolean }) {
  const reduce = useReducedMotion();
  const height = 150 + ((book.name.length * 7) % 40);
  const color = textOn(book.cover_color);
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir el libro de ${book.name}`}
      className="group relative flex shrink-0 flex-col items-center justify-between border-[3px] border-ink px-1 py-2"
      style={{
        background: book.cover_color,
        color,
        height,
        width: 54,
        boxShadow: "3px 0 0 0 var(--shadow)",
        transformOrigin: "bottom center",
      }}
      whileHover={reduce ? undefined : { y: -10 }}
      whileFocus={reduce ? undefined : { y: -10 }}
      animate={
        opening
          ? reduce
            ? { opacity: 0.4 }
            : { y: -40, rotateY: -70, scale: 1.15, zIndex: 30 }
          : { y: 0, rotateY: 0, scale: 1 }
      }
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <span aria-hidden className="h-1 w-8 opacity-70" style={{ background: color }} />
      <span
        className="font-title text-[0.55rem] leading-tight"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: height - 60 }}
      >
        <span className="line-clamp-1">{book.name}</span>
      </span>
      <span className="flex flex-col items-center gap-1">
        {book.nextBirthdayDays !== null && book.nextBirthdayDays <= 7 ? (
          <span title={`Cumpleaños en ${book.nextBirthdayDays} días`}>
            <PixelIcon name="cake" scale={1.5} />
          </span>
        ) : null}
        {book.avatarSignedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.avatarSignedUrl}
            alt=""
            className="h-8 w-8 border-2 border-ink object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <PixelIcon name="heart" scale={1.5} />
        )}
      </span>
      <span aria-hidden className="h-1 w-8 opacity-70" style={{ background: color }} />
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
    setTimeout(() => router.push(`/libro/${id}`), 380);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="mb-1 block text-sm font-semibold">
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
          <label htmlFor="sort" className="mb-1 block text-sm font-semibold">
            Ordenar por
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field">
            <option value="name">Nombre</option>
            <option value="updated">Última edición</option>
            <option value="birthday">Próximo cumpleaños</option>
          </select>
        </div>
      </div>

      <div className="pixel-border bg-wood p-3 sm:p-4" style={{ perspective: 900 }}>
        {list.length === 0 ? (
          <p className="px-2 py-10 text-center text-[#f4e4c1]">Ningún libro coincide con “{query}”.</p>
        ) : (
          <>
            {/* Escritorio/tablet: repisas anchas */}
            <div className="hidden flex-col gap-3 sm:flex">
              {chunk(list, 10).map((row, i) => (
                <div
                  key={i}
                  className="flex min-h-[200px] items-end gap-1.5 overflow-x-auto border-b-[10px] border-wood-dark px-2 pt-6 no-scrollbar"
                >
                  {row.map((b) => (
                    <BookSpine key={b.id} book={b} opening={opening === b.id} onOpen={() => open(b.id)} />
                  ))}
                </div>
              ))}
            </div>
            {/* Móvil: repisas apiladas con scroll vertical */}
            <div className="flex flex-col gap-3 sm:hidden">
              {chunk(list, 5).map((row, i) => (
                <div key={i} className="flex min-h-[200px] items-end gap-1.5 border-b-[10px] border-wood-dark px-1 pt-6">
                  {row.map((b) => (
                    <BookSpine key={b.id} book={b} opening={opening === b.id} onOpen={() => open(b.id)} />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
