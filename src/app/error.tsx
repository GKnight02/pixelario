"use client";

import { Sprite } from "@/components/guides/sprite";
import { buttonClasses } from "@/components/pixel/pixel-button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative z-10 mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <Sprite animal="turtle" state="idle" scale={4} />
      <h1 className="text-sm">Algo se atascó</h1>
      <p>La tortuga tropezó con una página. Intenta de nuevo en un momento.</p>
      <button type="button" onClick={reset} className={buttonClasses("primary")}>
        Reintentar
      </button>
    </main>
  );
}
