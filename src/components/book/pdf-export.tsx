"use client";

import { useState } from "react";
import { CHAPTERS } from "@/lib/constants";
import { TurtleLoader } from "../guides/turtle-loader";
import { buttonClasses } from "../pixel/pixel-button";
import { PixelIcon } from "../pixel/pixel-icon";
import { Sheet } from "../pixel/sheet";

/** Elegir capítulos y descargar el libro en PDF (la tortuga acompaña la espera). */
export function PdfExport({ personId, name }: { personId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(["gustos", "disgustos", "anecdotas", "fechas"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pdf/${personId}?caps=${selected.join(",")}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `libro-de-${name.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setError("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={buttonClasses("paper")} onClick={() => setOpen(true)}>
        <PixelIcon name="download" scale={2} /> PDF
      </button>
      <Sheet open={open} onClose={() => !loading && setOpen(false)} title="Exportar a PDF">
        {loading ? (
          <TurtleLoader text="Imprimiendo tu libro…" />
        ) : (
          <div className="flex flex-col gap-4">
            <p>Elige qué capítulos incluir. La portada y el índice siempre van.</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CHAPTERS.map((c) => (
                <li key={c.slug}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="pixel-check"
                      checked={selected.includes(c.slug)}
                      onChange={(e) =>
                        setSelected((s) => (e.target.checked ? [...s, c.slug] : s.filter((x) => x !== c.slug)))
                      }
                    />
                    <PixelIcon name={c.icon} scale={2} />
                    {c.title}
                  </label>
                </li>
              ))}
            </ul>
            {error ? <p className="text-berry">{error}</p> : null}
            <button type="button" className={buttonClasses("primary")} onClick={download}>
              <PixelIcon name="download" scale={2} /> Descargar PDF
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
