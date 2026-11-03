"use client";

import { useState } from "react";
import { SpeechBubble } from "./guide";
import { Sprite } from "./sprite";

/** Gato dormido sobre la página vacía: al hacer clic despierta y sugiere qué escribir. */
export function SleepingCat({
  suggestion,
  children,
}: {
  suggestion: string;
  children?: React.ReactNode;
}) {
  const [awake, setAwake] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <button
        type="button"
        onClick={() => setAwake((a) => !a)}
        aria-label={awake ? "Dejar dormir al gato" : "Despertar al gato"}
        className="cursor-pointer"
      >
        <Sprite animal="cat" state={awake ? "talk" : "special"} scale={4} />
      </button>
      {awake ? (
        <div className="max-w-sm text-left">
          <SpeechBubble text={suggestion} side="top">
            {children}
          </SpeechBubble>
        </div>
      ) : (
        <p className="text-ink-soft">Esta página está vacía… el gato duerme. Tócalo.</p>
      )}
    </div>
  );
}
