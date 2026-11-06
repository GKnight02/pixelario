import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Sprite } from "../guides/sprite";
import { PixelIcon } from "../pixel/pixel-icon";
import { ThemeToggle } from "../pixel/theme-toggle";
import { NavLink } from "./nav-link";

/** Cabecera del autor: cenefa de azulejo, barra cobalto con pestañas, zorro mensajero y vela. */
export function AppHeader({ pending, name }: { pending: number; name: string | null }) {
  return (
    <header className="relative z-20">
      <div aria-hidden className="cenefa" />
      <div className="bg-bar text-on-bar">
        <div className="mx-auto flex h-16 max-w-6xl items-stretch gap-1.5 px-3 sm:gap-6 sm:px-6">
          <Link
            href="/estanteria"
            className="mr-auto flex items-center font-display text-[1.45rem] leading-none tracking-wide sm:text-[2.3rem]"
          >
            PIXELARIO
          </Link>

          <nav aria-label="Principal" className="flex items-stretch gap-1">
            <NavLink href="/estanteria" icon="books" label="Estantería" />
            <NavLink
              href="/recordatorios"
              label="Recordatorios"
              ariaLabel={
                pending > 0
                  ? `Recordatorios: ${pending} pendiente${pending === 1 ? "" : "s"}`
                  : "Recordatorios"
              }
              leading={
                <Sprite
                  animal="fox"
                  scale={1}
                  state={pending > 0 ? "special" : "idle"}
                  label="Zorro mensajero"
                />
              }
              badge={
                pending > 0 ? (
                  <span className="min-w-6 bg-ochre px-1 text-center font-title text-[0.55rem] leading-5 text-on-ochre">
                    {pending > 99 ? "99+" : pending}
                  </span>
                ) : null
              }
            />
            <NavLink href="/perfil" icon="user" label={name ?? "Perfil"} />
          </nav>

          <div className="flex items-center gap-1.5 text-ink sm:gap-2">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center border-2 border-on-bar/60 text-on-bar transition-colors duration-150 hover:bg-on-bar hover:text-bar sm:h-11 sm:w-11"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <PixelIcon name="door" scale={2} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
