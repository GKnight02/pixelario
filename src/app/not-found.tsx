import Link from "next/link";
import { Sprite } from "@/components/guides/sprite";
import { buttonClasses } from "@/components/pixel/pixel-button";

export default function NotFound() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <Sprite animal="owl" state="talk" scale={4} />
      <h1 className="text-sm">Página no encontrada</h1>
      <p>El búho buscó en todos los estantes y no encontró esta página.</p>
      <Link href="/" className={buttonClasses("primary")}>
        Volver al inicio
      </Link>
    </main>
  );
}
