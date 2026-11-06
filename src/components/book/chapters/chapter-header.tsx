import { PixelIcon } from "../../pixel/pixel-icon";

/** Encabezado de capítulo: número grande al margen, título, subtítulo y acción. */
export function ChapterHeader({
  number,
  title,
  icon,
  subtitle,
  action,
}: {
  number?: number;
  title: string;
  icon: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-end gap-4">
          {number ? (
            <span aria-hidden className="font-display text-[4.6rem] leading-[0.78] text-cobalt">
              {number}
            </span>
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-cobalt text-on-cobalt">
              <PixelIcon name={icon} scale={3} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="flex items-center gap-2.5 text-[2.3rem] leading-none sm:text-[2.7rem]">
              {number ? <span className="sr-only">Capítulo {number}: </span> : null}
              {title}
              {number ? (
                <span className="text-cobalt">
                  <PixelIcon name={icon} scale={2.5} />
                </span>
              ) : null}
            </h2>
            {subtitle ? <p className="mt-1.5 text-ink-soft">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div aria-hidden className="cenefa mt-5 h-[6px]! bg-size-[6px_6px]!" />
    </header>
  );
}
