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
            className="flex -rotate-3 items-center gap-2 border-4 border-cobalt bg-paper px-5 py-3 font-title text-sm text-cobalt"
            style={{ boxShadow: "4px 4px 0 0 var(--shadow)" }}
            initial={{ y: -40, scale: 1.25, rotate: -8 }}
            animate={{ y: 0, scale: 1, rotate: -3 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
          >
            <PixelIcon name="check" scale={3} />
            {label}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
