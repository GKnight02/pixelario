import { PixelIcon } from "../pixel/pixel-icon";

const CONFETTI_COLORS = ["#E0A030", "#B04A5A", "#5A8F4E", "#3E6E8E", "#F4E4C1", "#8E7CC3"];

export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              "--delay": `${(i % 7) * 0.35}s`,
              "--dur": `${2.2 + (i % 5) * 0.3}s`,
              "--drift": `${((i % 3) - 1) * 18}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Portada del libro (la usan el autor y el visitante). */
export function Cover({
  name,
  nickname,
  relationship,
  tagline,
  coverColor,
  avatarUrl,
  countdown,
  birthdayToday,
  author,
}: {
  name: string;
  nickname?: string | null;
  relationship: string;
  tagline?: string | null;
  coverColor: string;
  avatarUrl?: string | null;
  countdown?: { label: string; text: string } | null;
  birthdayToday?: boolean;
  author?: string | null;
}) {
  return (
    <div
      className="pixel-border relative mx-auto flex w-full max-w-md flex-col items-center gap-4 overflow-hidden px-6 py-8 text-center text-[#fdf6e3]"
      style={{ background: coverColor }}
    >
      {birthdayToday ? <Confetti /> : null}
      {/* marco dorado pixel */}
      <div aria-hidden className="pointer-events-none absolute inset-2 border-2 border-dashed border-[#e0a030]/70" />

      <p className="font-title text-[0.55rem] tracking-widest opacity-85">El libro de</p>
      <div className="h-32 w-32 border-4 border-[#2a1a10] bg-[#f4e4c1] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={`Avatar de ${name}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8b3a3a]">
            <PixelIcon name="heart" scale={7} />
          </div>
        )}
      </div>
      <h1 className="text-base leading-relaxed wrap-break-word sm:text-lg">{name}</h1>
      {nickname ? <p className="-mt-2 text-lg">“{nickname}”</p> : null}
      <p className="border-2 border-[#fdf6e3]/70 px-3 py-0.5 text-sm capitalize">{relationship}</p>
      {tagline ? <p className="max-w-xs text-lg italic">{tagline}</p> : null}

      {birthdayToday ? (
        <p className="pixel-border-sm bg-accent px-3 py-2 font-title text-[0.6rem] text-[#2a1a10]">
          ¡Hoy es su cumpleaños!
        </p>
      ) : countdown ? (
        <p className="flex items-center gap-2 bg-[#2a1a10]/30 px-3 py-1.5">
          <PixelIcon name="cake" scale={2} />
          <span>
            {countdown.label}: <strong>{countdown.text}</strong>
          </span>
        </p>
      ) : null}

      {author ? <p className="text-sm opacity-80">Escrito por {author}</p> : null}
    </div>
  );
}
