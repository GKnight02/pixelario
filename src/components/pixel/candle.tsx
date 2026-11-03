/** Vela pixel con llama animada (dos cuadros alternos). */
export function Candle({ scale = 4, lit = true }: { scale?: number; lit?: boolean }) {
  return (
    <svg
      width={8 * scale}
      height={14 * scale}
      viewBox="0 0 8 14"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {lit ? (
        <>
          <g className="flame-a">
            <rect x="3" y="0" width="1" height="1" fill="#ffe08a" />
            <rect x="3" y="1" width="2" height="1" fill="#ffb347" />
            <rect x="2" y="2" width="3" height="1" fill="#ffb347" />
            <rect x="3" y="2" width="1" height="1" fill="#fff4c2" />
            <rect x="3" y="3" width="2" height="1" fill="#e0602a" />
          </g>
          <g className="flame-b">
            <rect x="4" y="0" width="1" height="1" fill="#ffe08a" />
            <rect x="3" y="1" width="2" height="1" fill="#ffb347" />
            <rect x="3" y="2" width="3" height="1" fill="#ffb347" />
            <rect x="4" y="2" width="1" height="1" fill="#fff4c2" />
            <rect x="3" y="3" width="2" height="1" fill="#e0602a" />
          </g>
        </>
      ) : (
        <rect x="4" y="2" width="1" height="1" fill="#9a8a7a" opacity="0.7" />
      )}
      <rect x="3" y="4" width="1" height="1" fill="#2a1a10" />
      {/* cera */}
      <rect x="2" y="5" width="4" height="6" fill="#f4ecd8" />
      <rect x="2" y="5" width="1" height="6" fill="#fffaf0" />
      <rect x="5" y="5" width="1" height="6" fill="#d8ccb0" />
      <rect x="4" y="6" width="1" height="2" fill="#fffaf0" />
      {/* plato */}
      <rect x="0" y="11" width="8" height="1" fill="#b08040" />
      <rect x="1" y="12" width="6" height="1" fill="#7a4e2d" />
      <rect x="6" y="9" width="2" height="1" fill="#b08040" />
      <rect x="7" y="10" width="1" height="1" fill="#b08040" />
    </svg>
  );
}
