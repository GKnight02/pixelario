import { Sprite } from "./sprite";

/** La tortuga camina sobre una barra pixel mientras algo carga. */
export function TurtleLoader({ text = "Cargando…" }: { text?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-10">
      <div className="relative w-64 max-w-full">
        <div className="turtle-track w-16" style={{ "--track": "12rem" } as React.CSSProperties}>
          <Sprite animal="turtle" state="special" scale={2} label="Tortuga caminando" />
        </div>
        <div className="pixel-border-sm h-4 w-full bg-paper">
          <div className="h-full w-full bg-[repeating-linear-gradient(90deg,var(--leaf)_0_8px,transparent_8px_12px)] opacity-70" />
        </div>
      </div>
      <p className="font-title text-[0.6rem]">{text}</p>
    </div>
  );
}
