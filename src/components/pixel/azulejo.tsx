/**
 * Azulejo personal: un patrón pixel 8×8 con simetría de talavera
 * (espejo horizontal, vertical y diagonal), determinista a partir de una semilla.
 * La misma persona siempre recibe el mismo azulejo.
 */

const SIZE = 8;
const HALF = SIZE / 2;

/** FNV-1a de 32 bits. */
function hash(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG mulberry32. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Celdas del cuadrante 4×4 (simétrico respecto a su diagonal).
 * 0 = esmalte, 1 = tinta principal (cobalto), 2 = color de la persona, 3 = ocre.
 */
export function azulejoCells(seed: string): number[][] {
  const next = rng(hash(seed.trim().toLowerCase() || "pixelario"));
  const q: number[][] = Array.from({ length: HALF }, () => Array(HALF).fill(0));
  for (let y = 0; y < HALF; y++) {
    for (let x = y; x < HALF; x++) {
      const r = next();
      // Más esmalte cerca del centro del cuadrante para que el motivo "respire".
      const v = r < 0.34 ? 0 : r < 0.62 ? 1 : r < 0.88 ? 2 : 3;
      q[y][x] = v;
      q[x][y] = v;
    }
  }
  // La esquina exterior siempre lleva tinta: al juntar azulejos se forma una flor.
  q[0][0] = 1;
  // El centro del azulejo siempre tiene color, nunca queda vacío.
  if (q[HALF - 1][HALF - 1] === 0) q[HALF - 1][HALF - 1] = 2;

  return Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => {
      const qy = y < HALF ? y : SIZE - 1 - y;
      const qx = x < HALF ? x : SIZE - 1 - x;
      return q[qy][qx];
    }),
  );
}

export function Azulejo({
  seed,
  color,
  size = 48,
  className = "",
  framed = true,
  title,
}: {
  seed: string;
  /** Color de la persona (su `cover_color`). */
  color: string;
  size?: number;
  className?: string;
  /** Borde de tinta alrededor del azulejo. */
  framed?: boolean;
  title?: string;
}) {
  const cells = azulejoCells(seed);
  const fills = ["var(--glaze)", "var(--cobalt)", color, "var(--ochre)"];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      shapeRendering="crispEdges"
      className={`shrink-0 ${framed ? "outline-2 outline-ink" : ""} ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width={SIZE} height={SIZE} fill={fills[0]} />
      {cells.flatMap((row, y) =>
        row.map((v, x) =>
          v === 0 ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fills[v]} />,
        ),
      )}
    </svg>
  );
}

/** El azulejo repetido como paño (para portadas y fondos de lomo). */
export function AzulejoField({
  seed,
  color,
  tile = 40,
  className = "",
  style,
}: {
  seed: string;
  color: string;
  tile?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = `az-${hash(seed).toString(36)}`;
  const cells = azulejoCells(seed);
  const fills = ["var(--glaze)", "var(--cobalt)", color, "var(--ochre)"];
  return (
    <svg aria-hidden className={className} style={style} width="100%" height="100%">
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g transform={`scale(${tile / SIZE})`} shapeRendering="crispEdges">
            <rect width={SIZE} height={SIZE} fill={fills[0]} />
            {cells.flatMap((row, y) =>
              row.map((v, x) =>
                v === 0 ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fills[v]} />,
              ),
            )}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
