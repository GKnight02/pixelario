import { PixelIcon } from "../../pixel/pixel-icon";

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
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b-4 border-double border-ink/50 pb-3">
      <div>
        {number ? <p className="font-title text-[0.5rem] text-ink-soft">Capítulo {number}</p> : null}
        <h2 className="mt-1 flex items-center gap-2 text-[0.8rem] sm:text-sm">
          <PixelIcon name={icon} scale={2.5} /> {title}
        </h2>
        {subtitle ? <p className="mt-1 text-ink-soft">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
