"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PixelIcon } from "../pixel/pixel-icon";
import { Sprite, type Animal, type SpriteState } from "./sprite";

/** Texto con efecto máquina de escribir. */
function useTypewriter(text: string, speed = 28) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => {
      clearInterval(id);
      setCount(0);
    };
  }, [text, speed, reduce]);

  const shown = reduce ? text.length : count;
  return { shown: text.slice(0, shown), done: shown >= text.length };
}

export function SpeechBubble({
  text,
  onClose,
  children,
  side = "right",
}: {
  text: string;
  onClose?: () => void;
  children?: React.ReactNode;
  side?: "right" | "top";
}) {
  const { shown, done } = useTypewriter(text);
  return (
    <div className="pixel-border-sm relative bg-paper px-3 py-2 text-[0.95rem] leading-snug">
      {/* colita del globo */}
      <span
        aria-hidden
        className={
          side === "right"
            ? "absolute top-4 -left-[9px] h-3 w-3 rotate-45 border-b-2 border-l-2 border-ink bg-paper"
            : "absolute -bottom-[9px] left-6 h-3 w-3 rotate-45 border-r-2 border-b-2 border-ink bg-paper"
        }
      />
      <p aria-live="polite" className={onClose ? "pr-7" : ""}>
        <span className="sr-only">{text}</span>
        <span aria-hidden className={done ? "" : "caret"}>
          {shown}
        </span>
      </p>
      {done && children ? <div className="mt-2 flex flex-wrap gap-2">{children}</div> : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar diálogo"
          className="absolute top-1.5 right-1.5 p-1 text-ink-soft hover:text-ink"
        >
          <PixelIcon name="x" scale={1.5} />
        </button>
      ) : null}
    </div>
  );
}

/** Personaje guía con globo de diálogo que siempre se puede cerrar. */
export function Guide({
  animal,
  text,
  state,
  scale = 3,
  closable = true,
  children,
  className = "",
  layout = "row",
  storageKey,
}: {
  animal: Animal;
  text: string;
  state?: SpriteState;
  scale?: 1 | 2 | 3 | 4 | 5 | 6;
  closable?: boolean;
  children?: React.ReactNode;
  className?: string;
  layout?: "row" | "column";
  /** Si se indica, recordar que el usuario cerró este diálogo. */
  storageKey?: string;
}) {
  const [open, setOpen] = useState(true);
  const [talking, setTalking] = useState(true);

  useEffect(() => {
    if (!storageKey) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preferencia guardada en el navegador
      if (localStorage.getItem(`guide:${storageKey}`) === "closed") setOpen(false);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    const t = setTimeout(() => setTalking(false), Math.min(4000, text.length * 30 + 400));
    return () => clearTimeout(t);
  }, [text]);

  const close = () => {
    setOpen(false);
    if (storageKey) {
      try {
        localStorage.setItem(`guide:${storageKey}`, "closed");
      } catch {}
    }
  };

  return (
    <div
      className={`flex ${layout === "row" ? "items-start gap-3" : "flex-col items-center gap-2"} ${className}`}
    >
      <Sprite animal={animal} scale={scale} state={state ?? (talking && open ? "talk" : "idle")} />
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="min-w-0 flex-1"
          >
            <SpeechBubble
              text={text}
              onClose={closable ? close : undefined}
              side={layout === "row" ? "right" : "top"}
            >
              {children}
            </SpeechBubble>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
