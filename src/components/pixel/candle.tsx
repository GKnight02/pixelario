/** Vela pixel sobre un candelero de talavera, con llama animada (dos cuadros alternos). */
export function Candle({ scale = 4, lit = true }: { scale?: number; lit?: boolean }) {
  return (
    <svg
      width={10 * scale}
      height={15 * scale}
      viewBox="0 0 10 15"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {lit ? (
        <>
          <g className="flame-a">
            <rect x="4" y="0" width="1" height="1" fill="#ffe08a" />
            <rect x="4" y="1" width="2" height="1" fill="#ffb347" />
            <rect x="3" y="2" width="3" height="1" fill="#ffb347" />
            <rect x="4" y="2" width="1" height="1" fill="#fff4c2" />
            <rect x="4" y="3" width="2" height="1" fill="#e8761a" />
          </g>
          <g className="flame-b">
            <rect x="5" y="0" width="1" height="1" fill="#ffe08a" />
            <rect x="4" y="1" width="2" height="1" fill="#ffb347" />
            <rect x="4" y="2" width="3" height="1" fill="#ffb347" />
            <rect x="5" y="2" width="1" height="1" fill="#fff4c2" />
            <rect x="4" y="3" width="2" height="1" fill="#e8761a" />
          </g>
        </>
      ) : (
        <rect x="5" y="2" width="1" height="1" fill="#8a94b8" opacity="0.8" />
      )}
      {/* mecha */}
      <rect x="4" y="4" width="1" height="1" fill="#0f1a4d" />
      {/* cera */}
      <rect x="3" y="5" width="4" height="6" fill="#f2f5fb" />
      <rect x="6" y="5" width="1" height="6" fill="#c6d0e6" />
      <rect x="3" y="5" width="1" height="6" fill="#ffffff" />
      <rect x="5" y="6" width="1" height="2" fill="#ffffff" />
      {/* candelero de talavera: esmalte con flor cobalto */}
      <rect x="0" y="11" width="10" height="1" fill="#0f1a4d" />
      <rect x="1" y="12" width="8" height="2" fill="#f2f5fb" />
      <rect x="2" y="12" width="1" height="1" fill="#1d3a9e" />
      <rect x="4" y="12" width="2" height="1" fill="#1d3a9e" />
      <rect x="7" y="12" width="1" height="1" fill="#1d3a9e" />
      <rect x="3" y="13" width="1" height="1" fill="#e8a31a" />
      <rect x="6" y="13" width="1" height="1" fill="#e8a31a" />
      <rect x="0" y="12" width="1" height="2" fill="#0f1a4d" />
      <rect x="9" y="12" width="1" height="2" fill="#0f1a4d" />
      <rect x="1" y="14" width="8" height="1" fill="#0f1a4d" />
    </svg>
  );
}
