import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPublicBook } from "@/lib/public-book";

export const alt = "Portada pixel de un libro de Pixelario";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen Open Graph: la portada del libro en pixel art (no suma visitas). */
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [font, book] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/PressStart2P-Regular.ttf")),
    getPublicBook(token, false),
  ]);

  const name = book?.person.name ?? "Libro cerrado";
  const color = book?.person.cover_color ?? "#8B3A3A";
  const relationship = book?.person.relationship ?? "";

  // Píxeles decorativos del borde
  const dots = Array.from({ length: 24 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b2238",
          fontFamily: "PressStart",
        }}
      >
        {/* estantería */}
        <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, height: 28, background: "#7a4e2d" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 440,
            height: 540,
            background: color,
            border: "10px solid #2a1a10",
            boxShadow: "16px 16px 0 0 #120c18",
            position: "relative",
            color: "#fdf6e3",
            padding: 30,
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              right: 18,
              bottom: 18,
              border: "4px dashed #e0a030",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 18, opacity: 0.85, marginBottom: 30 }}>EL LIBRO DE</div>
          <div
            style={{
              width: 120,
              height: 120,
              background: "#f4e4c1",
              border: "8px solid #2a1a10",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 30,
            }}
          >
            {/* corazón pixel */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."].map((row, y) => (
                <div key={y} style={{ display: "flex" }}>
                  {[...row].map((c, x) => (
                    <div
                      key={x}
                      style={{ width: 10, height: 10, background: c === "#" ? "#b04a5a" : "transparent" }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: name.length > 14 ? 28 : 40, lineHeight: 1.4, display: "flex" }}>{name}</div>
          {relationship ? (
            <div style={{ fontSize: 16, marginTop: 24, padding: "8px 14px", border: "3px solid #fdf6e3" }}>
              {relationship.toUpperCase()}
            </div>
          ) : null}
        </div>
        <div style={{ position: "absolute", top: 40, left: 50, display: "flex", gap: 16 }}>
          {dots.slice(0, 6).map((_, i) => (
            <div key={i} style={{ width: 12, height: 12, background: i % 2 ? "#e0a030" : "#5a8f4e" }} />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 20, right: 40, fontSize: 20, color: "#f2dfb4" }}>PIXELARIO</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "PressStart", data: font, style: "normal", weight: 400 }],
    },
  );
}
