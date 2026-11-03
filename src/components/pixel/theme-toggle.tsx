"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Theme } from "@/lib/types";
import { Candle } from "./candle";

const KEY = "pixelario-theme";

function resolve(pref: Theme) {
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
  }
  return pref;
}

export function applyTheme(pref: Theme) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* almacenamiento bloqueado: igual aplicamos */
  }
  document.documentElement.dataset.theme = resolve(pref);
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

function useResolvedTheme() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? "day",
    () => "day",
  );
}

/** Interruptor con forma de vela: encenderla = modo noche. */
export function ThemeToggle() {
  const theme = useResolvedTheme();
  const [, force] = useState(0);

  // Seguir al sistema cuando la preferencia es "system".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let pref: string | null = "system";
      try {
        pref = localStorage.getItem(KEY) ?? "system";
      } catch {}
      if (pref === "system") {
        applyTheme("system");
        force((n) => n + 1);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const night = theme === "night";
  return (
    <button
      type="button"
      onClick={() => applyTheme(night ? "day" : "night")}
      className="pixel-border-sm flex h-11 w-11 items-end justify-center bg-paper pb-1"
      aria-label={night ? "Apagar la vela (modo día)" : "Encender la vela (modo noche)"}
      aria-pressed={night}
      title={night ? "Modo día" : "Modo noche"}
    >
      <Candle scale={2.5} lit={night} />
    </button>
  );
}

/** En un dispositivo nuevo (sin preferencia local) aplica la del perfil. */
export function ThemeSync({ pref }: { pref: Theme }) {
  useEffect(() => {
    let local: string | null = null;
    try {
      local = localStorage.getItem(KEY);
    } catch {}
    if (!local) applyTheme(pref);
  }, [pref]);
  return null;
}
