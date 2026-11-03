export type Animal = "owl" | "cat" | "fox" | "turtle" | "rabbit";
export type SpriteState = "idle" | "talk" | "special";

const ROW: Record<SpriteState, number> = { idle: 0, talk: 1, special: 2 };

export const ANIMAL_NAMES: Record<Animal, string> = {
  owl: "Búho bibliotecario",
  cat: "Gato",
  fox: "Zorro mensajero",
  turtle: "Tortuga",
  rabbit: "Conejo",
};

/** Sprite animado por cuadros (hoja PNG 4×3 de 32 px, animada con steps()). */
export function Sprite({
  animal,
  state = "idle",
  scale = 3,
  speed,
  className = "",
  flip = false,
  label,
}: {
  animal: Animal;
  state?: SpriteState;
  scale?: 1 | 2 | 3 | 4 | 5 | 6;
  speed?: number;
  className?: string;
  flip?: boolean;
  label?: string;
}) {
  const defaultSpeed = state === "idle" ? 1600 : state === "talk" ? 600 : 900;
  return (
    <div
      role="img"
      aria-label={label ?? ANIMAL_NAMES[animal]}
      className={`sprite ${className}`}
      style={
        {
          backgroundImage: `url(/sprites/${animal}.png)`,
          "--scale": scale,
          "--row": ROW[state],
          "--speed": `${speed ?? defaultSpeed}ms`,
          transform: flip ? "scaleX(-1)" : undefined,
        } as React.CSSProperties
      }
    />
  );
}
