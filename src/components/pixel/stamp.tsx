"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { PixelIcon } from "./pixel-icon";

/**
 * Sello que cae sobre la página con un pequeño rebote.
 * Se dispara cada vez que cambia `trigger` (p. ej. el `stamp` de un ActionState).
 */
export function Stamp({ trigger, label = "¡Guardado!" }: { trigger?: number; label?: string }) {
  const [visible, setVisible] = useState<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacción a un evento externo (guardado)
    setVisible(trigger);
    const t = setTimeout(() => setVisible(null), 1400);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={visible}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-1/3 z-[70] flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex -rotate-6 items-center gap-2 border-4 border-berry bg-paper/90 px-5 py-3 font-title text-sm text-berry"
            style={{ boxShadow: "4px 4px 0 0 var(--shadow)" }}
            initial={{ y: -160, scale: 1.6, rotate: -14 }}
            animate={{ y: 0, scale: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 520, damping: 16 }}
          >
            <PixelIcon name="check" scale={3} />
            {label}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
