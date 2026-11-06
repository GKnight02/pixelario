import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Guide } from "@/components/guides/guide";
import { NewBookButton } from "@/components/shelf/new-book";
import { Shelf } from "@/components/shelf/shelf";
import { UpcomingDates } from "@/components/shelf/upcoming-dates";
import { getShelf } from "@/lib/data";

export const metadata: Metadata = { title: "Estantería" };

export default async function ShelfPage() {
  const { books, upcoming, profile } = await getShelf();

  if (!profile.onboarded && books.length === 0) redirect("/bienvenida");

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[2.6rem] sm:text-[3.4rem]">
          {profile.display_name ? `Estantería de ${profile.display_name}` : "Tu estantería"}
        </h1>
        <NewBookButton />
      </div>

      {books.length === 0 ? (
        <div className="grout flex flex-col items-center border-[3px] border-ink">
          <div className="w-full max-w-lg px-6 py-12">
            <Guide
              animal="owl"
              scale={4}
              text="Tu estantería está vacía. Pulsa “Nuevo libro” y escribe el nombre de alguien importante: cada persona es un libro y cada sección, un capítulo."
              closable={false}
            />
          </div>
          <div aria-hidden className="h-3.5 w-full bg-ledge" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <Shelf books={books} />
          <UpcomingDates dates={upcoming} />
        </div>
      )}
    </div>
  );
}
