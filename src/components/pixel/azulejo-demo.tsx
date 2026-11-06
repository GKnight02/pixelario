"use client";

import { useState } from "react";
import { Azulejo, AzulejoField } from "./azulejo";

const COLORS = ["#2F8A4E", "#B8432F", "#E8A31A", "#8E2C48", "#1F7A8C"];

function colorFor(name: string) {
  let n = 0;
  for (const ch of name) n = (n + ch.charCodeAt(0)) % 997;
  return COLORS[n % COLORS.length];
}

/** Escribe un nombre y mira nacer su azulejo. */
export function AzulejoDemo() {
  const [name, setName] = useState("Abuela Rosa");
  const seed = name.trim() || "Pixelario";
  const color = colorFor(seed);
  return (
    <div className="grid border-[3px] border-ink bg-[var(--field)] sm:grid-cols-[1fr_auto]">
      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
        <label htmlFor="demo-name" className="font-title text-[0.6rem] text-cobalt">
          Escribe un nombre
        </label>
        <input
          id="demo-name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          className="field font-display! text-[2rem]! leading-none"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="max-w-sm text-ink-soft">
          Cada persona recibe un azulejo único que nace de su nombre. Viste su libro, su portada y su lugar
          en la estantería.
        </p>
      </div>
      <div className="relative grid min-h-56 place-items-center overflow-hidden border-t-[3px] border-ink sm:w-80 sm:border-t-0 sm:border-l-[3px]">
        <AzulejoField seed={seed} color={color} tile={40} className="absolute inset-0 opacity-35" />
        <div className="relative bg-glaze p-3 shadow-[6px_6px_0_0_var(--shadow)] outline-[3px] outline-ink">
          <Azulejo seed={seed} color={color} size={160} framed={false} title={`Azulejo de ${seed}`} />
        </div>
      </div>
    </div>
  );
}
