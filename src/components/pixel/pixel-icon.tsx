import { PIXEL_ICONS } from "./icons";

interface Props {
  name: string;
  /** Tamaño de cada píxel del ícono (el ícono mide 8 × scale px). */
  scale?: number;
  className?: string;
  title?: string;
}

/** Ícono pixel 8×8 en SVG, nítido en cualquier múltiplo entero. */
export function PixelIcon({ name, scale = 2, className, title }: Props) {
  const map = PIXEL_ICONS[name] ?? PIXEL_ICONS.other;
  const size = 8 * scale;
  const rects: React.ReactNode[] = [];
  map.forEach((row, y) => {
    [...row].slice(0, 8).forEach((c, x) => {
      if (c === ".") return;
      const fill = c === "a" ? "var(--accent)" : c === "w" ? "var(--paper)" : "currentColor";
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    });
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ flexShrink: 0 }}
    >
      {title ? <title>{title}</title> : null}
      {rects}
    </svg>
  );
}
