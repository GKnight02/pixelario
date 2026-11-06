import Link from "next/link";
import { dateTypeLabel } from "@/lib/constants";
import type { UpcomingDate } from "@/lib/data";
import { formatDayMonth, turningAge } from "@/lib/dates";
import { Sprite } from "../guides/sprite";
import { Azulejo } from "../pixel/azulejo";
import { PixelIcon } from "../pixel/pixel-icon";

function shortCountdown(days: number) {
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  if (days < 60) return `${days} días`;
  return `${Math.round(days / 30)} meses`;
}

function title(d: UpcomingDate) {
  const age = d.type === "birthday" ? turningAge(d, d.next) : null;
  const what = d.type === "custom" ? d.label : dateTypeLabel(d.type);
  return `${what} de ${d.person.name}${age ? ` (${age})` : ""}`;
}

/** Solo la próxima fecha a escala monumental; el resto, en lista. */
export function UpcomingDates({ dates }: { dates: UpcomingDate[] }) {
  const [first, ...rest] = dates;
  return (
    <section
      aria-labelledby="proximas"
      className="pixel-border flex flex-col self-start bg-[var(--field)] p-6"
    >
      <h2 id="proximas" className="text-[1.9rem] leading-none">
        Próxima fecha
      </h2>

      {!first ? (
        <p className="mt-3 text-ink-soft">
          Nada en los próximos 60 días. Agrega cumpleaños en el capítulo “Fechas importantes” de cada libro.
        </p>
      ) : (
        <>
          <Link
            href={`/libro/${first.person.id}/fechas`}
            className="group mt-3 block"
          >
            {first.days === 0 ? (
              <span className="block font-display text-[5.5rem] leading-[0.9] text-cobalt">
                ¡Hoy!
              </span>
            ) : (
              <span className="flex items-baseline gap-2 font-display leading-[0.85] text-cobalt">
                <span className="text-[8rem]">{first.days}</span>
                <span className="text-[2.4rem]">{first.days === 1 ? "día" : "días"}</span>
              </span>
            )}
            <span className="mt-2 flex items-center gap-3">
              <Azulejo seed={first.person.name} color={first.person.cover_color} size={36} />
              <span className="min-w-0">
                <span className="block text-lg leading-tight font-semibold group-hover:underline">
                  {title(first)}
                </span>
                <span className="text-ink-soft">{formatDayMonth(first.month, first.day)}</span>
              </span>
            </span>
          </Link>

          <Link
            href={`/libro/${first.person.id}/regalos`}
            className="mt-5 flex items-center gap-3 bg-glaze-2 p-3 transition-colors duration-150 hover:bg-grout"
          >
            <Sprite animal="owl" scale={1} label="Búho bibliotecario" />
            <span className="text-[0.95rem] leading-snug">
              ¿Ya sabes qué regalarle a {first.person.name}? Mira sus ideas de regalo.
            </span>
          </Link>

          {rest.length ? (
            <ul className="mt-6 flex flex-col">
              {rest.map((d) => (
                <li key={d.id} className="border-t-2 border-dashed border-grout">
                  <Link
                    href={`/libro/${d.person.id}/fechas`}
                    className="flex items-center gap-3 py-3 transition-colors duration-150 hover:text-cobalt"
                  >
                    <Azulejo seed={d.person.name} color={d.person.cover_color} size={24} />
                    <span className="min-w-0 flex-1 truncate">{title(d)}</span>
                    <span
                      className={`shrink-0 px-2 py-0.5 font-title text-[0.55rem] ${
                        d.days <= 7 ? "bg-ochre text-on-ochre" : "bg-glaze-2 text-ink"
                      }`}
                    >
                      {shortCountdown(d.days)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft">
        <PixelIcon name="calendar" scale={1.5} /> Fechas de los próximos 60 días
      </p>
    </section>
  );
}
