import { Guide } from "@/components/guides/guide";
import { Sprite } from "@/components/guides/sprite";
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

export default async function Landing({ searchParams }: PageProps<"/">) {
  const { adios } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);

  return (
    <div className="flex flex-col gap-12 pt-6">
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1 className="text-xl leading-relaxed sm:text-2xl">
            El libro de <span className="text-berry">tus personas</span>
          </h1>
          <p className="max-w-prose text-lg">
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

        <div className="pixel-border relative mx-auto flex w-full max-w-sm flex-col gap-2 bg-wood p-4">
          {[0, 1].map((shelf) => (
            <div key={shelf} className="flex items-end gap-1.5 border-b-8 border-wood-dark px-2 pt-6">
              {["#8B3A3A", "#5A8F4E", "#E0A030", "#3E6E8E", "#B04A5A", "#5C4A8B"]
                .slice(shelf * 2, shelf * 2 + 4)
                .map((c, i) => (
                  <div
                    key={c}
                    className="pixel-border-sm flex w-9 items-start justify-center pt-2"
                    style={{ background: c, height: `${96 + ((i * 13) % 28)}px` }}
                  >
                    <span className="h-1.5 w-5 bg-[#f4e4c1]/70" />
                  </div>
                ))}
              {shelf === 1 ? (
                <div className="ml-auto">
                  <Sprite animal="cat" state="special" scale={2} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="que-hay" className="flex flex-col gap-4">
        <h2 id="que-hay" className="text-sm">
          Capítulos de cada libro
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="pixel-border paper flex gap-3 p-4">
              <span className="text-cover">
                <PixelIcon name={f.icon} scale={3} />
              </span>
              <div>
                <h3 className="mb-1 text-[0.65rem]">{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
