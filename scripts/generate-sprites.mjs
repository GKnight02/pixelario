// Genera los sprite sheets PNG de los personajes guía.
//
//   node scripts/generate-sprites.mjs
//
// Cada personaje se dibuja en un mapa de 16×16 y se escala ×2 (cuadros de 32×32).
// Hoja de 4 columnas × 3 filas (128×96):
//   fila 0 → idle (parpadea en el último cuadro)
//   fila 1 → talk (boca abierta/cerrada)
//   fila 2 → especial (dormir, correr, caminar, saltar)
//
// Son sprites de partida: pueden reemplazarse por arte hecho en Aseprite o Piskel
// manteniendo el mismo formato de hoja.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sprites");
const SCALE = 2;
const MAP = 16;
const FRAME = MAP * SCALE; // 32
const COLS = 4;
const ROWS = 3;

// Leyenda común:
//  .  transparente     E  ojo (se cierra al parpadear/dormir)
//  M  boca             F  patas (cuadro A)     G  patas (cuadro B, solo al correr/caminar)
const CHARACTERS = {
  owl: {
    special: "sleep",
    palette: {
      k: "#2a1a10", b: "#8a5a3c", w: "#f4e4c1", c: "#c89a6a", y: "#e0a030",
      E: "#2a1a10", F: "#e0a030",
    },
    lid: "#8a5a3c",
    mouthClosed: "#8a5a3c",
    map: [
      "................",
      "..k..........k..",
      "..kbk......kbk..",
      "..kbbkkkkkkbbk..",
      ".kbbbbbbbbbbbbk.",
      ".kbwwwwbbwwwwbk.",
      ".kbwwEEbbEEwwbk.",
      ".kbwwEEbbEEwwbk.",
      ".kbbwwwyywwwbbk.",
      ".kbbbbbMMbbbbbk.",
      ".kbccccccccccbk.",
      ".kbcbcbcbcbcbck.",
      ".kbccccccccccbk.",
      "..kbbbbbbbbbbk..",
      "...kkFFkkFFkk...",
      "................",
    ],
  },
  cat: {
    special: "sleep",
    palette: {
      k: "#2a1a10", o: "#e09a4a", p: "#e07a8a", w: "#f8eedd", E: "#2a1a10", F: "#f8eedd",
    },
    lid: "#b0703a",
    mouthClosed: "#e09a4a",
    map: [
      "................",
      "..kk........kk..",
      "..kpk......kpk..",
      "..kookkkkkkook..",
      ".kooooooooooook.",
      ".kooEEooooEEook.",
      ".kooEEooooEEook.",
      ".koooooppoooook.",
      ".kwooooMMoooowk.",
      "..kooooooooook..",
      "..kwwoooooowwk..",
      ".kooowwwwwwoook.",
      ".kooowwwwwwoook.",
      ".kooooooooooook.",
      "..kFFkkkkkkFFk..",
      "................",
    ],
  },
  fox: {
    special: "run",
    palette: {
      k: "#2a1a10", o: "#d0602a", w: "#f8eedd", E: "#2a1a10", F: "#2a1a10", G: "#2a1a10",
    },
    lid: "#a04a20",
    mouthClosed: "#f8eedd",
    map: [
      "................",
      ".kk..........kk.",
      ".kok........kok.",
      ".kook......kook.",
      ".koookkkkkkoook.",
      ".kooooooooooook.",
      ".kooEEooooEEook.",
      ".kowEEooooEEwok.",
      ".kwwwwwkkwwwwwk.",
      "..kwwwwMMwwwwk..",
      "...kkwwwwwwkk...",
      "..kooooooooook..",
      "..koowwwwwwook..",
      "..kooooooooookk.",
      "...FG......GF...",
      "...FG......GF...",
    ],
  },
  turtle: {
    special: "walk",
    palette: {
      k: "#1e2a14", s: "#5a8f4e", h: "#3e6a36", n: "#9acd6a", E: "#1e2a14", F: "#9acd6a", G: "#9acd6a",
    },
    lid: "#9acd6a",
    mouthClosed: "#9acd6a",
    map: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "....kkkkkk......",
      "...kshshshk.....",
      "..kshshshshk....",
      ".kshshshshshkkk.",
      ".kssssssssssknEk",
      "kkkkkkkkkkkkknMk",
      "..FFGG..FFGG....",
      "..FFGG..FFGG....",
      "................",
    ],
  },
  rabbit: {
    special: "hop",
    palette: {
      k: "#3a2a2a", w: "#f4f0e8", p: "#f0a0b0", E: "#3a2a2a", F: "#d8cfc2",
    },
    lid: "#d8d0c8",
    mouthClosed: "#f4f0e8",
    map: [
      "....kk....kk....",
      "...kwk....kwk...",
      "...kpk....kpk...",
      "...kpk....kpk...",
      "...kwk....kwk...",
      "..kkwkkkkkkwkk..",
      "..kwwwwwwwwwwk..",
      ".kwwEEwwwwEEwwk.",
      ".kwwEEwwwwEEwwk.",
      ".kwpwwwppwwwpwk.",
      "..kwwwwMMwwwwk..",
      "...kwwwwwwwwk...",
      "..kwwwwwwwwwwk..",
      "..kwwwwwwwwwwk..",
      "...kFFkkkkFFk...",
      "................",
    ],
  },
};

function hexToRgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function validate(name, map) {
  if (map.length !== MAP) throw new Error(`${name}: ${map.length} filas (se esperan ${MAP})`);
  map.forEach((row, i) => {
    if (row.length !== MAP) throw new Error(`${name}: fila ${i} tiene ${row.length} columnas`);
  });
}

/** Dibuja un cuadro de 32×32 dentro de la hoja. */
function drawFrame(sheet, sheetW, col, row, char, opts) {
  const { eyes = "open", mouth = "closed", legs = "A", dy = 0, zzz = -1 } = opts;
  const ox = col * FRAME;
  const oy = row * FRAME;

  for (let y = 0; y < MAP; y++) {
    for (let x = 0; x < MAP; x++) {
      let c = char.map[y][x];
      let color = null;
      if (c === ".") continue;
      if (c === "E") color = eyes === "open" ? char.palette.E : char.lid;
      else if (c === "M") color = mouth === "open" ? "#5a1a1a" : char.mouthClosed;
      else if (c === "F") {
        if (legs === "B") continue;
        color = char.palette.F;
      } else if (c === "G") {
        if (legs !== "B") continue;
        color = char.palette.G;
      } else color = char.palette[c];
      if (!color) throw new Error(`Color no definido para "${c}"`);

      const [r, g, b, a] = hexToRgba(color);
      const ty = y + dy;
      if (ty < 0 || ty >= MAP) continue;
      for (let sy = 0; sy < SCALE; sy++) {
        for (let sx = 0; sx < SCALE; sx++) {
          const px = ox + x * SCALE + sx;
          const py = oy + ty * SCALE + sy;
          const i = (py * sheetW + px) * 4;
          sheet[i] = r;
          sheet[i + 1] = g;
          sheet[i + 2] = b;
          sheet[i + 3] = a;
        }
      }
    }
  }

  // "Z" de dormir (en píxeles finales), sube un poco en los cuadros 2-3.
  if (zzz >= 0) {
    const z = ["1111", "0010", "0100", "1111"];
    const bx = ox + 25;
    const by = oy + 6 - zzz * 3;
    const [r, g, b] = hexToRgba(char.palette.k);
    z.forEach((line, yy) =>
      [...line].forEach((bit, xx) => {
        if (bit !== "1") return;
        const i = ((by + yy) * sheetW + bx + xx) * 4;
        sheet[i] = r;
        sheet[i + 1] = g;
        sheet[i + 2] = b;
        sheet[i + 3] = 255;
      }),
    );
  }
}

function specialFrames(kind) {
  switch (kind) {
    case "sleep":
      return [
        { eyes: "closed", zzz: 0 },
        { eyes: "closed", zzz: 0 },
        { eyes: "closed", zzz: 1 },
        { eyes: "closed", zzz: 1 },
      ];
    case "run":
      return [
        { legs: "A", dy: 0 },
        { legs: "B", dy: -1 },
        { legs: "A", dy: 0 },
        { legs: "B", dy: -1 },
      ];
    case "walk":
      return [{ legs: "A" }, { legs: "A" }, { legs: "B" }, { legs: "B" }];
    case "hop":
      return [{ dy: 0 }, { dy: -1 }, { dy: -2 }, { dy: -1 }];
    default:
      throw new Error(kind);
  }
}

// ---------- Codificador PNG mínimo ----------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro: ninguno
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- Generación ----------
mkdirSync(OUT_DIR, { recursive: true });
const W = FRAME * COLS;
const H = FRAME * ROWS;

for (const [name, char] of Object.entries(CHARACTERS)) {
  validate(name, char.map);
  const sheet = Buffer.alloc(W * H * 4);

  const rows = [
    // idle: quieto, parpadea en el último cuadro
    [{}, {}, {}, { eyes: "closed" }],
    // talk
    [{ mouth: "closed" }, { mouth: "open" }, { mouth: "closed" }, { mouth: "open" }],
    // especial
    specialFrames(char.special),
  ];

  rows.forEach((frames, r) => frames.forEach((opts, c) => drawFrame(sheet, W, c, r, char, opts)));
  writeFileSync(join(OUT_DIR, `${name}.png`), encodePng(W, H, sheet));
  console.log(`✓ sprites/${name}.png (${char.special})`);
}
