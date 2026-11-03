"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "../pixel/pixel-button";
import { PixelIcon } from "../pixel/pixel-icon";
import { Candle } from "../pixel/candle";

import type { ChapterLink } from "./chapter-links";

export type { ChapterLink } from "./chapter-links";

function subscribeMq(cb: () => void) {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeMq,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

export function ChapterIndex({
  chapters,
  current,
  hrefFor: hrefForProp,
  basePath,
  onSelect,
}: {
  chapters: ChapterLink[];
  current: string;
  hrefFor?: (slug: string) => string;
  /** Alternativa serializable a hrefFor (desde Server Components). */
  basePath?: string;
  onSelect?: (slug: string) => void;
}) {
  const hrefFor =
    hrefForProp ?? (basePath !== undefined ? (slug: string) => `${basePath}${slug ? `/${slug}` : ""}` : undefined);
  return (
    <nav aria-label="Índice de capítulos">
      <ol className="flex flex-col gap-1">
        {chapters.map((c, i) => {
          const active = c.slug === current;
          const inner = (
            <>
              <span className="w-6 text-right font-title text-[0.5rem] text-ink-soft">{i === 0 ? "·" : i}</span>
              <PixelIcon name={c.icon} scale={2} />
              <span className="flex-1">{c.title}</span>
              {typeof c.count === "number" ? (
                <span className="font-title text-[0.5rem] text-ink-soft">{c.count}</span>
              ) : null}
            </>
          );
          const cls = `flex min-h-11 w-full items-center gap-2 border-b-2 border-dotted border-ink/30 px-2 text-left ${
            active ? "bg-accent/30 font-semibold" : "hover:bg-ink/5"
          }`;
          return (
            <li key={c.slug || "cover"}>
              {hrefFor ? (
                <Link href={hrefFor(c.slug)} aria-current={active ? "page" : undefined} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className={cls}
                  onClick={() => onSelect?.(c.slug)}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function NavArrow({
  to,
  dir,
  onGo,
}: {
  to: ChapterLink | null;
  dir: "left" | "right";
  onGo: (slug: string) => void;
}) {
  if (!to) return <span />;
  return (
    <button
      type="button"
      onClick={() => onGo(to.slug)}
      className={buttonClasses("paper", "sm")}
      aria-label={`${dir === "left" ? "Anterior" : "Siguiente"}: ${to.title}`}
    >
      {dir === "left" ? <PixelIcon name="left" scale={1.5} /> : null}
      <span className="hidden sm:inline">{to.short}</span>
      {dir === "right" ? <PixelIcon name="right" scale={1.5} /> : null}
    </button>
  );
}

/**
 * Libro abierto: doble página en escritorio (índice a la izquierda), una página
 * con índice desplegable en tablet y una página con marcapáginas abajo en móvil.
 * Sirve tanto para el autor (navegación por rutas) como para el visitante (por estado).
 */
export function BookShell({
  title,
  coverColor,
  chapters,
  current,
  hrefFor,
  onNavigate,
  leftExtra,
  children,
}: {
  title: string;
  coverColor: string;
  chapters: ChapterLink[];
  current: string;
  hrefFor?: (slug: string) => string;
  onNavigate?: (slug: string) => void;
  leftExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const desktop = useIsDesktop();
  const reduce = useReducedMotion();
  const index = Math.max(0, chapters.findIndex((c) => c.slug === current));
  const [prevIndex, setPrevIndex] = useState(index);
  const [direction, setDirection] = useState(1);
  const [tocOpen, setTocOpen] = useState(false);

  // Dirección del paso de página según el capítulo anterior (ajuste de estado durante el render).
  if (index !== prevIndex) {
    setDirection(index > prevIndex ? 1 : -1);
    setPrevIndex(index);
    setTocOpen(false);
  }

  const go = (slug: string) => {
    if (hrefFor) router.push(hrefFor(slug), { scroll: false });
    else onNavigate?.(slug);
  };
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;

  // Flechas del teclado para pasar página (si no se está escribiendo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, dialog, [contenteditable]")) return;
      if (e.key === "ArrowRight" && next) go(next.slug);
      if (e.key === "ArrowLeft" && prev) go(prev.slug);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const variants = desktop
    ? {
        enter: (d: number) => (reduce ? { opacity: 0 } : { rotateY: d > 0 ? 75 : -75, opacity: 0.4 }),
        center: { rotateY: 0, opacity: 1 },
        exit: (d: number) => (reduce ? { opacity: 0 } : { rotateY: d > 0 ? -75 : 75, opacity: 0 }),
      }
    : {
        enter: (d: number) => (reduce ? { opacity: 0 } : { x: d > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => (reduce ? { opacity: 0 } : { x: d > 0 ? -80 : 80, opacity: 0 }),
      };

  return (
    <div className="relative pb-20 sm:pb-0">
      {/* Tapa del libro */}
      <div
        className="pixel-border relative p-2 sm:p-3"
        style={{ background: coverColor, perspective: 1600 }}
      >
        <div className="grid lg:grid-cols-[19rem_1fr]">
          {/* Página izquierda: índice (solo escritorio) */}
          <aside className="paper hidden border-r-4 border-ink/40 p-5 lg:block">
            <p className="mb-1 text-sm text-ink-soft">El libro de</p>
            <h1 className="mb-5 text-sm wrap-break-word">{title}</h1>
            <ChapterIndex chapters={chapters} current={current} hrefFor={hrefFor} onSelect={go} />
            {leftExtra ? <div className="mt-6">{leftExtra}</div> : null}
            <div className="mt-8 flex justify-center opacity-90 in-data-[theme=day]:hidden">
              <Candle scale={5} />
            </div>
          </aside>

          {/* Página derecha: contenido */}
          <div className="paper relative min-h-[60vh] overflow-hidden">
            {/* Tablet: índice desplegable */}
            <div className="hidden border-b-2 border-dotted border-ink/30 px-4 py-2 sm:block lg:hidden">
              <button
                type="button"
                onClick={() => setTocOpen((o) => !o)}
                aria-expanded={tocOpen}
                className="flex min-h-11 w-full items-center gap-2 text-left"
              >
                <PixelIcon name="menu" scale={2} />
                <span className="font-title text-[0.6rem]">{title}</span>
                <span className="ml-auto text-sm text-ink-soft">{chapters[index]?.title}</span>
              </button>
              {tocOpen ? (
                <div className="pb-2">
                  <ChapterIndex chapters={chapters} current={current} hrefFor={hrefFor} onSelect={go} />
                </div>
              ) : null}
            </div>

            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduce ? 0.15 : 0.32, ease: "easeOut" }}
                style={{ transformOrigin: direction > 0 ? "left center" : "right center" }}
                drag={!desktop && !reduce ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                dragDirectionLock
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70 && next) go(next.slug);
                  else if (info.offset.x > 70 && prev) go(prev.slug);
                }}
                className="p-4 sm:p-6"
              >
                {children}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between border-t-2 border-dotted border-ink/30 px-4 py-3">
              <NavArrow to={prev} dir="left" onGo={go} />
              <span className="font-title text-[0.5rem] text-ink-soft">
                {index === 0 ? "Portada" : `${index} / ${chapters.length - 1}`}
              </span>
              <NavArrow to={next} dir="right" onGo={go} />
            </div>
          </div>
        </div>
      </div>

      {/* Móvil: marcapáginas abajo */}
      <nav
        aria-label="Capítulos"
        className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t-4 border-ink bg-wood no-scrollbar sm:hidden"
      >
        {chapters.map((c) => {
          const active = c.slug === current;
          return (
            <button
              key={c.slug || "cover"}
              type="button"
              onClick={() => go(c.slug)}
              aria-current={active ? "page" : undefined}
              aria-label={c.title}
              className={`flex min-w-16 flex-1 flex-col items-center gap-0.5 border-x border-ink/40 px-1 pt-1 pb-2 text-[0.7rem] leading-tight transition-transform ${
                active ? "-translate-y-1 bg-accent text-[#2a1a10]" : "bg-paper text-ink"
              }`}
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)" }}
            >
              <PixelIcon name={c.icon} scale={2} />
              {c.short}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
