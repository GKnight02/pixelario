import Link from "next/link";
import { dateTypeLabel, DATE_TYPES } from "@/lib/constants";
import type { UpcomingDate } from "@/lib/data";
import { countdownText, formatDayMonth, turningAge } from "@/lib/dates";
import { PixelIcon } from "../pixel/pixel-icon";

export function UpcomingDates({ dates }: { dates: UpcomingDate[] }) {
  return (
    <section aria-labelledby="proximas" className="pixel-border paper p-4">
      <h2 id="proximas" className="mb-3 flex items-center gap-2 text-[0.7rem]">
        <PixelIcon name="calendar" scale={2} /> Próximas fechas
      </h2>
      {dates.length === 0 ? (
        <p className="text-ink-soft">
          Nada en los próximos 60 días. Agrega cumpleaños en el capítulo “Fechas importantes” de cada libro.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dates.map((d) => {
            const age = d.type === "birthday" ? turningAge(d, d.next) : null;
            return (
              <li key={d.id}>
                <Link
                  href={`/libro/${d.person.id}/fechas`}
                  className="flex items-center gap-3 border-2 border-transparent p-1.5 hover:border-ink"
                >
                  <span
                    className="pixel-border-sm flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{ background: d.person.cover_color, color: "#fdf6e3" }}
                  >
                    <PixelIcon name={DATE_TYPES.find((t) => t.value === d.type)?.icon ?? "calendar"} scale={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {d.person.name} · {d.type === "custom" ? d.label : dateTypeLabel(d.type)}
                      {age ? ` (${age})` : ""}
                    </span>
                    <span className="text-sm text-ink-soft">{formatDayMonth(d.month, d.day)}</span>
                  </span>
                  <span
                    className={`shrink-0 font-title text-[0.5rem] ${d.days <= 7 ? "text-berry" : "text-ink-soft"}`}
                  >
                    {countdownText(d.days)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
