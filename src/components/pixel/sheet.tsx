"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "./pixel-button";
import { PixelIcon } from "./pixel-icon";

/** Hoja emergente con forma de nota (usa <dialog> nativo: foco atrapado y Escape). */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-auto max-h-[92dvh] w-[min(36rem,calc(100vw-1.5rem))] overflow-visible bg-transparent p-0 text-ink backdrop:bg-black/50"
    >
      {open ? (
        <motion.div
          initial={{ y: 40, rotate: -2, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="pixel-border paper relative max-h-[92dvh] overflow-y-auto scroll-thin p-5 pt-7"
        >
          {/* cinta adhesiva */}
          <span
            aria-hidden
            className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-accent/70"
          />
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-[0.75rem] sm:text-sm">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={buttonClasses("paper", "sm")}
            >
              <PixelIcon name="x" scale={1.5} />
            </button>
          </div>
          {children}
        </motion.div>
      ) : null}
    </dialog>
  );
}

/** Botón que abre una hoja; `children` recibe `close` para cerrarla tras guardar. */
export function SheetTrigger({
  label,
  title,
  icon = "pencil",
  variant = "primary",
  size = "md",
  ariaLabel,
  children,
}: {
  label?: React.ReactNode;
  title: string;
  icon?: string;
  variant?: "primary" | "paper" | "leaf" | "berry" | "ghost";
  size?: "sm" | "md";
  ariaLabel?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses(variant, size)}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <PixelIcon name={icon} scale={size === "sm" ? 1.5 : 2} />
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        {children(() => setOpen(false))}
      </Sheet>
    </>
  );
}

/** Cierra la hoja cuando la acción devuelve un `stamp` nuevo. */
export function useCloseOnSuccess(stamp: number | undefined, close?: () => void) {
  const last = useRef(stamp);
  useEffect(() => {
    if (stamp && stamp !== last.current) {
      last.current = stamp;
      close?.();
    }
  }, [stamp, close]);
}
