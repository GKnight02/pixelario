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
      className="m-auto max-h-[92dvh] w-[min(36rem,calc(100vw-1.5rem))] overflow-visible bg-transparent p-0 text-ink backdrop:bg-[#0f1a4d]/55"
    >
      {open ? (
        <motion.div
          initial={{ y: 16, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="pixel-border relative max-h-[92dvh] overflow-y-auto scroll-thin bg-paper p-6 pt-0"
        >
          {/* cenefa de azulejo */}
          <div aria-hidden className="cenefa -mx-6 mb-5" />
          <div className="mb-5 flex items-start justify-between gap-3">
            <h2 className="text-[2rem] leading-none">{title}</h2>
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
