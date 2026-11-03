"use client";

import { useState } from "react";
import { PixelIcon } from "./pixel-icon";

/** 1 a 3 corazones (le gusta) o calaveras (no le gusta). */
export function Intensity({ value, kind }: { value: number; kind: "like" | "dislike" }) {
  const icon = kind === "like" ? "heart" : "skull";
  const color = kind === "like" ? "text-berry" : "text-ink";
  return (
    <span className={`inline-flex gap-0.5 ${color}`} aria-label={`Intensidad ${value} de 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= value ? "" : "opacity-20"}>
          <PixelIcon name={icon} scale={1.5} />
        </span>
      ))}
    </span>
  );
}

export function IntensityInput({
  name,
  kind,
  defaultValue = 2,
}: {
  name: string;
  kind: "like" | "dislike";
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const icon = kind === "like" ? "heart" : "skull";
  const color = kind === "like" ? "text-berry" : "text-ink";
  return (
    <div role="radiogroup" aria-label="Intensidad" className={`flex gap-2 ${color}`}>
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} de 3`}
          onClick={() => setValue(n)}
          className={`pixel-border-sm bg-paper p-2 ${n <= value ? "" : "opacity-30"}`}
        >
          <PixelIcon name={icon} scale={2.5} />
        </button>
      ))}
    </div>
  );
}
