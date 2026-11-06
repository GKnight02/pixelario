import { Azulejo, AzulejoField } from "../pixel/azulejo";
import { PixelIcon } from "../pixel/pixel-icon";

const CONFETTI_COLORS = ["#E8A31A", "#1D3A9E", "#2F8A4E", "#B8432F", "#F2F5FB", "#5B4BA0"];

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

/**
 * Portada del libro (la usan el autor y el visitante): el azulejo de la persona
 * repetido como paño, con una cartela de esmalte al centro.
 */
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
    <div className="pixel-border relative mx-auto w-full max-w-md overflow-hidden" style={{ background: coverColor }}>
      <AzulejoField seed={name} color={coverColor} tile={48} className="absolute inset-0" />
      {birthdayToday ? <Confetti /> : null}

      <div className="relative m-6 flex flex-col items-center gap-4 border-[3px] border-cobalt-deep bg-glaze px-6 py-8 text-center sm:m-8">
        <div className="h-32 w-32 border-[3px] border-cobalt-deep bg-glaze-2 shadow-[4px_4px_0_0_var(--shadow)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={`Avatar de ${name}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Azulejo seed={name} color={coverColor} size={96} framed={false} />
            </div>
          )}
        </div>
        <h1 className="flex flex-col leading-none wrap-break-word">
          <span className="text-[1.5rem] text-cobalt">El libro de</span>
          <span className="text-[2.6rem] sm:text-[3rem]">{name}</span>
        </h1>
        {nickname ? <p className="-mt-2 text-lg text-ink-soft">“{nickname}”</p> : null}
        <p className="bg-cobalt px-3 py-1 font-title text-[0.55rem] text-on-cobalt">{relationship}</p>
        {tagline ? <p className="max-w-xs text-lg">{tagline}</p> : null}

        {birthdayToday ? (
          <p className="pixel-border-sm bg-ochre px-3 py-2 font-title text-[0.6rem] text-on-ochre">
            ¡Hoy es su cumpleaños!
          </p>
        ) : countdown ? (
          <p className="flex items-center gap-2 border-t-2 border-dashed border-grout pt-3 text-ink">
            <PixelIcon name="cake" scale={2} className="text-cobalt" />
            <span>
              {countdown.label}: <strong>{countdown.text}</strong>
            </span>
          </p>
        ) : null}

        {author ? <p className="text-sm text-ink-soft">Escrito por {author}</p> : null}
      </div>
    </div>
  );
}
