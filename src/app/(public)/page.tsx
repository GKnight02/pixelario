import { Guide } from "@/components/guides/guide";
import { Sprite } from "@/components/guides/sprite";
import { Azulejo } from "@/components/pixel/azulejo";
import { AzulejoDemo } from "@/components/pixel/azulejo-demo";
import { PixelLink } from "@/components/pixel/pixel-button";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  { icon: "heart", title: "Gustos y disgustos", text: "Lo que ama y lo que no soporta, por categorías." },
  { icon: "camera", title: "Anécdotas", text: "Una línea de tiempo de recuerdos compartidos, con fotos." },
  { icon: "cake", title: "Fechas importantes", text: "Cumpleaños y aniversarios con cuenta regresiva." },
  { icon: "gift", title: "Ideas de regalo", text: "Nacen de sus gustos y llegan a tiempo." },
  { icon: "envelope", title: "Recordatorios", text: "El zorro te avisa en la app y por correo." },
  { icon: "lock", title: "Privado por defecto", text: "Compartes solo los capítulos que elijas." },
];

/** Estantería de ejemplo (nombres ilustrativos). */
const SAMPLE = [
  { name: "Mamá", color: "#1D3A9E", h: 232 },
  { name: "Lucía", color: "#2F8A4E", h: 206 },
  { name: "Diego", color: "#B8432F", h: 244 },
  { name: "Abuela Rosa", color: "#0F1A4D", h: 220 },
  { name: "Andrés", color: "#5B4BA0", h: 196 },
];

function spineText(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? "#0f1a4d" : "#f2f5fb";
}

export default async function Landing({ searchParams }: PageProps<"/">) {
  const { adios } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);

  return (
    <div className="flex flex-col gap-20 pt-6 pb-8">
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex min-w-0 flex-col gap-7">
          <h1 className="text-[3.2rem] leading-[0.92] sm:text-[5.2rem]">
            El libro de <span className="text-cobalt">tus personas</span>
          </h1>
          <p className="max-w-prose text-xl leading-relaxed">
            Escribe un libro pixel sobre cada persona importante de tu vida: qué le gusta, qué no, las
            anécdotas que comparten, sus fechas especiales y recordatorios para cuidarla mejor. Sin feed,
            sin likes, sin seguidores. Solo tu estantería.
          </p>
          <div className="flex flex-wrap gap-3">
            {loggedIn ? (
              <PixelLink href="/estanteria" variant="primary" icon="books">
                Ir a mi estantería
              </PixelLink>
            ) : (
              <>
                <PixelLink href="/registro" variant="primary" icon="pencil">
                  Empezar mi libro
                </PixelLink>
                <PixelLink href="/login" icon="door">
                  Ya tengo cuenta
                </PixelLink>
              </>
            )}
          </div>
          <Guide
            animal="owl"
            text={
              adios
                ? "Tu cuenta y tus libros fueron borrados. Aquí estaré si quieres volver a escribir."
                : "¡Hola! Soy el búho bibliotecario. Te ayudaré a llenar tu estantería, página por página."
            }
          />
        </div>

        <figure className="grout relative min-w-0 overflow-hidden border-[3px] border-ink shadow-[6px_6px_0_0_var(--shadow)]">
          <figcaption className="absolute top-3 right-3 bg-glaze px-2 py-0.5 text-sm text-ink-soft">
            Estantería de ejemplo
          </figcaption>
          <div className="flex items-end gap-2 px-4 pt-10 sm:gap-3 sm:px-6">
            {SAMPLE.map((b) => (
              <div
                key={b.name}
                className="flex w-14 shrink-0 flex-col items-center gap-2 border-[3px] sm:w-16 border-cobalt-deep px-1 pt-2 pb-3"
                style={{
                  background: b.color,
                  color: spineText(b.color),
                  height: b.h,
                  boxShadow: "4px 0 0 0 var(--shadow)",
                }}
              >
                <Azulejo seed={b.name} color={b.color} size={44} />
                <span
                  className="font-display text-[1.6rem] leading-none"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {b.name}
                </span>
              </div>
            ))}
            <div className="ml-auto hidden self-end sm:block">
              <Sprite animal="cat" state="special" scale={2} />
            </div>
          </div>
          <div className="h-3.5 bg-ledge" />
          <div className="flex items-center justify-between gap-4 bg-[var(--field)] px-6 py-4">
            <span className="font-display text-[1.5rem] leading-none">Cumpleaños de Lucía</span>
            <span className="flex items-baseline gap-2 font-display leading-none text-cobalt">
              <span className="text-[3rem]">6</span>
              <span className="text-[1.4rem]">días</span>
            </span>
          </div>
        </figure>
      </section>

      <section aria-labelledby="azulejo" className="flex flex-col gap-5">
        <h2 id="azulejo" className="text-[2.4rem]">
          Un azulejo para cada persona
        </h2>
        <AzulejoDemo />
      </section>

      <section aria-labelledby="que-hay" className="flex flex-col gap-5">
        <h2 id="que-hay" className="text-[2.4rem]">
          Capítulos de cada libro
        </h2>
        {/* El índice de un libro: cada capítulo en su renglón, con su número de página. */}
        <div className="border-[3px] border-ink bg-[var(--field)]">
          <div aria-hidden className="cenefa" />
          <ol className="px-5 py-3 sm:px-8">
            {FEATURES.map((f, i) => (
              <li
                key={f.title}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 border-b-2 border-dashed border-grout py-4 last:border-b-0 sm:grid-cols-[auto_14rem_1fr_auto]"
              >
                <span className="flex h-11 w-11 items-center justify-center bg-cobalt text-on-cobalt">
                  <PixelIcon name={f.icon} scale={3} />
                </span>
                <h3 className="font-display! text-[1.7rem] leading-none tracking-normal [font-size-adjust:none]!">
                  {f.title}
                </h3>
                <p className="col-span-full col-start-2 text-ink-soft sm:col-span-1 sm:col-start-3">{f.text}</p>
                <span
                  aria-hidden
                  className="row-start-1 col-start-3 font-display text-[1.5rem] leading-none text-cobalt sm:col-start-4"
                >
                  {i + 1}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
