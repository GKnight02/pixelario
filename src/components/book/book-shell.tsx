"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { buttonClasses } from "../pixel/pixel-button";
import { PixelIcon } from "../pixel/pixel-icon";
import { Candle } from "../pixel/candle";
import { Azulejo, AzulejoField } from "../pixel/azulejo";

import type { ChapterLink } from "./chapter-links";

export type { ChapterLink } from "./chapter-links";

/** Curva de una hoja que se levanta, se acelera y se asienta. */
const FLIP_EASE = [0.645, 0.045, 0.355, 1] as const;
const FLIP_MS = 0.62;
const OPEN_MS = 0.95;

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
      <ol className="flex flex-col">
        {chapters.map((c, i) => {
          const active = c.slug === current;
          const inner = (
            <>
              <span className="w-5 text-right font-display text-[1.25rem] leading-none opacity-70">
                {c.slug ? i : ""}
              </span>
              <PixelIcon name={c.icon} scale={2} />
              <span className="flex-1">{c.title}</span>
              {typeof c.count === "number" ? (
                <span className={`min-w-6 px-1 text-center font-title text-[0.5rem] ${active ? "" : "bg-glaze text-ink-soft"}`}>
                  {c.count}
                </span>
              ) : null}
            </>
          );
          const cls = `flex min-h-11 w-full items-center gap-2.5 border-b-2 border-dashed border-grout px-2 text-left transition-colors duration-150 ${
            active ? "bg-cobalt font-semibold text-on-cobalt" : "hover:bg-cobalt/10"
          }`;
          return (
            <li key={c.slug || "cover"}>
              {hrefFor ? (
                <Link href={hrefFor(c.slug)} aria-current={active ? "page" : undefined} className={cls} scroll={false}>
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
 * Hoja que gira sobre el lomo. Hacia adelante, la hoja actual se levanta y cae a la
 * izquierda dejando ver la nueva; hacia atrás, la hoja nueva llega desde la izquierda.
 * El reverso de cada hoja es papel con renglones.
 */
function leafVariants(reduce: boolean): Variants {
  if (reduce) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: { duration: 0.15 } },
      exit: { opacity: 0, transition: { duration: 0.12 } },
    };
  }
  return {
    enter: (d: number) =>
      d > 0 ? { rotateY: 0, zIndex: 0 } : { rotateY: -180, zIndex: 3 },
    center: {
      rotateY: 0,
      zIndex: 2,
      transition: { duration: FLIP_MS, ease: FLIP_EASE, zIndex: { duration: 0 } },
    },
    exit: (d: number) =>
      d > 0
        ? {
            rotateY: -180,
            zIndex: 3,
            // al asentarse sobre la página izquierda se funde y deja ver el índice
            opacity: [1, 1, 0],
            transition: {
              duration: FLIP_MS,
              ease: FLIP_EASE,
              zIndex: { duration: 0 },
              opacity: { duration: FLIP_MS + 0.12, times: [0, 0.8, 1], ease: "linear" },
            },
          }
        : { rotateY: 0, zIndex: 0, transition: { duration: FLIP_MS } },
  };
}

/** Sombra que la hoja proyecta mientras pasa (oscurece al llegar a 90°). */
const shadeVariants: Variants = {
  enter: (d: number) => ({ opacity: d > 0 ? 0 : 0.45 }),
  center: { opacity: 0, transition: { duration: FLIP_MS, ease: FLIP_EASE } },
  exit: (d: number) => ({ opacity: d > 0 ? 0.45 : 0, transition: { duration: FLIP_MS, ease: FLIP_EASE } }),
};

/** Tapa que se abre al llegar al libro. */
function OpeningCover({ title, coverColor, onDone }: { title: string; coverColor: string; onDone: () => void }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-40"
      style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
      initial={{ rotateY: 0 }}
      animate={{ rotateY: -180 }}
      transition={{ duration: OPEN_MS, ease: FLIP_EASE, delay: 0.12 }}
      onAnimationComplete={onDone}
    >
      {/* exterior: el azulejo de la persona */}
      <div
        className="absolute inset-0 grid place-items-center overflow-hidden border-[3px] border-cobalt-deep"
        style={{ background: coverColor, backfaceVisibility: "hidden" }}
      >
        <AzulejoField seed={title} color={coverColor} tile={48} className="absolute inset-0" />
        <div className="relative flex flex-col items-center gap-3 border-[3px] border-cobalt-deep bg-glaze px-8 py-6 text-center">
          <Azulejo seed={title} color={coverColor} size={72} />
          <p className="flex flex-col font-display leading-none">
            <span className="text-[1.4rem] text-cobalt">El libro de</span>
            <span className="text-[2.6rem]">{title}</span>
          </p>
        </div>
      </div>
      {/* interior: guarda de la tapa */}
      <div
        className="absolute inset-0 border-[3px] border-cobalt-deep bg-glaze-2"
        style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
      >
        <AzulejoField seed={title} color={coverColor} tile={24} className="absolute inset-0 opacity-25" />
      </div>
    </motion.div>
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
  const reduce = Boolean(useReducedMotion());
  const index = Math.max(0, chapters.findIndex((c) => c.slug === current));
  const [prevIndex, setPrevIndex] = useState(index);
  const [direction, setDirection] = useState(1);
  const [tocOpen, setTocOpen] = useState(false);
  const [opening, setOpening] = useState(true);

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

  // Precarga los capítulos vecinos para que la hoja no espere al servidor.
  useEffect(() => {
    if (!hrefFor) return;
    if (prev) router.prefetch(hrefFor(prev.slug));
    if (next) router.prefetch(hrefFor(next.slug));
  }, [hrefFor, prev, next, router]);

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

  const showCover = opening && !reduce;
  const variants = leafVariants(reduce);

  return (
    <div className="relative pb-20 sm:pb-0">
      {/* Tapa del libro: el azulejo de la persona como marco */}
      <div className="pixel-border relative p-2.5 sm:p-4" style={{ background: coverColor }}>
        <AzulejoField seed={title} color={coverColor} tile={32} className="absolute inset-0" />
        <div className="relative grid overflow-hidden border-[3px] border-cobalt-deep lg:grid-cols-[19rem_1fr]">
          {/* Página izquierda: índice (solo escritorio) */}
          <motion.aside
            className="relative hidden bg-glaze-2 p-6 lg:block"
            initial={showCover ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: showCover ? OPEN_MS * 0.55 : 0 }}
          >
            {/* canal: sombra junto al lomo */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8"
              style={{ background: "linear-gradient(to left, color-mix(in srgb, var(--shadow) 18%, transparent), transparent)" }}
            />
            <div className="mb-6 flex items-center gap-3">
              <Azulejo seed={title} color={coverColor} size={48} />
              <h1 className="flex min-w-0 flex-col leading-none wrap-break-word">
                <span className="text-[1.2rem] text-cobalt">El libro de</span>
                <span className="text-[2.3rem]">{title}</span>
              </h1>
            </div>
            <ChapterIndex chapters={chapters} current={current} hrefFor={hrefFor} onSelect={go} />
            {leftExtra ? <div className="mt-6">{leftExtra}</div> : null}
            <div className="mt-8 flex justify-center opacity-90 in-data-[theme=day]:hidden">
              <Candle scale={5} />
            </div>
          </motion.aside>

          {/* Página derecha: contenido */}
          <div className="relative z-10 min-h-[60vh] bg-paper" style={{ perspective: 3000, perspectiveOrigin: "0% 50%" }}>
            {showCover ? (
              <OpeningCover title={title} coverColor={coverColor} onDone={() => setOpening(false)} />
            ) : null}

            {/* Tablet: índice desplegable */}
            <div className="hidden border-b-2 border-dashed border-grout px-4 py-2 sm:block lg:hidden">
              <button
                type="button"
                onClick={() => setTocOpen((o) => !o)}
                aria-expanded={tocOpen}
                className="flex min-h-11 w-full items-center gap-2 text-left"
              >
                <PixelIcon name="menu" scale={2} />
                <span className="font-display text-[1.6rem] leading-none">{title}</span>
                <span className="ml-auto text-sm text-ink-soft">{chapters[index]?.title}</span>
              </button>
              <AnimatePresence initial={false}>
                {tocOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden pb-2"
                  >
                    <ChapterIndex chapters={chapters} current={current} hrefFor={hrefFor} onSelect={go} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Escenario de las hojas: la hoja puede volar sobre la página izquierda, pero no
                desbordar hacia arriba ni hacia abajo. */}
            <div
              className="relative"
              style={{
                perspective: desktop ? 2600 : 1600,
                perspectiveOrigin: "0% 50%",
                clipPath: "inset(0 -200% 0 -200%)",
              }}
            >
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="relative"
                  style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
                  drag={!desktop && !reduce ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  dragDirectionLock
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -70 && next) go(next.slug);
                    else if (info.offset.x > 70 && prev) go(prev.slug);
                  }}
                >
                  {/* anverso */}
                  <div className="paper relative min-h-[60vh] p-5 sm:p-8" style={{ backfaceVisibility: "hidden" }}>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 w-10"
                      style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--shadow) 16%, transparent), transparent)" }}
                    />
                    {children}
                    {!reduce ? (
                      <motion.span
                        aria-hidden
                        variants={shadeVariants}
                        custom={direction}
                        className="pointer-events-none absolute inset-0"
                        style={{ background: "linear-gradient(to left, var(--shadow), transparent 70%)" }}
                      />
                    ) : null}
                  </div>
                  {/* reverso */}
                  {!reduce ? (
                    <div
                      aria-hidden
                      className="paper absolute inset-0 bg-glaze-2"
                      style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                    >
                      <span
                        className="absolute inset-y-0 right-0 w-10"
                        style={{ background: "linear-gradient(to left, color-mix(in srgb, var(--shadow) 16%, transparent), transparent)" }}
                      />
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative flex items-center justify-between border-t-2 border-dashed border-grout px-4 py-3 lg:pr-16">
              <NavArrow to={prev} dir="left" onGo={go} />
              <span className="font-display text-[1.4rem] leading-none text-ink-soft">
                {index === 0 ? "Portada" : `— ${index} de ${chapters.length - 1} —`}
              </span>
              <NavArrow to={next} dir="right" onGo={go} />
            </div>

            {/* Esquina doblada: otra forma de pasar la página */}
            {next ? (
              <button
                type="button"
                onClick={() => go(next.slug)}
                aria-label={`Pasar la página: ${next.title}`}
                title={next.title}
                className="group absolute right-0 bottom-0 hidden h-9 w-9 transition-[width,height] duration-150 ease-out hover:h-12 hover:w-12 lg:block"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-glaze-2 shadow-[-3px_-3px_0_0_var(--shadow)]"
                  style={{ clipPath: "polygon(0 100%, 100% 0, 0 0)" }}
                />
                <span aria-hidden className="absolute inset-0 bg-cobalt-deep" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Móvil: marcapáginas abajo */}
      <nav
        aria-label="Capítulos"
        className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t-[3px] border-ink bg-bar no-scrollbar sm:hidden"
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
              className={`flex min-w-16 flex-1 flex-col items-center gap-0.5 border-x border-ink/40 px-1 pt-1 pb-2 text-[0.7rem] leading-tight transition-transform duration-150 ${
                active ? "-translate-y-1 bg-ochre text-on-ochre" : "bg-paper text-ink"
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
