import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Sprite } from "../guides/sprite";
import { PixelIcon } from "../pixel/pixel-icon";
import { ThemeToggle } from "../pixel/theme-toggle";
import { NavLink } from "./nav-link";

/** Cabecera del autor: estantería, zorro mensajero con contador, perfil y vela. */
export function AppHeader({ pending, name }: { pending: number; name: string | null }) {
  return (
    <header className="relative z-20 border-b-4 border-ink bg-wood text-[#f4e4c1]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4">
        <Link href="/estanteria" className="mr-auto font-title text-[0.65rem] sm:text-xs">
          Pixelario
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/estanteria" icon="books" label="Estantería" />
          <Link
            href="/recordatorios"
            className="relative flex items-center gap-1 px-1"
            aria-label={
              pending > 0
                ? `Recordatorios: ${pending} pendiente${pending === 1 ? "" : "s"}`
                : "Recordatorios"
            }
          >
            <Sprite animal="fox" scale={1} state={pending > 0 ? "special" : "idle"} label="Zorro mensajero" />
            <span className="relative text-accent">
              <PixelIcon name="envelope" scale={2} />
              {pending > 0 ? (
                <span className="absolute -top-2 -right-3 min-w-5 border-2 border-ink bg-berry px-1 text-center font-title text-[0.5rem] leading-4 text-[#fdf6e3]">
                  {pending > 99 ? "99+" : pending}
                </span>
              ) : null}
            </span>
          </Link>
          <NavLink href="/perfil" icon="user" label={name ?? "Perfil"} />
        </nav>

        <div className="flex items-center gap-2 text-ink">
          <ThemeToggle />
          <form action={signOut}>
            <button
              type="submit"
              className="pixel-border-sm flex h-11 w-11 items-center justify-center bg-paper"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <PixelIcon name="door" scale={2} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
