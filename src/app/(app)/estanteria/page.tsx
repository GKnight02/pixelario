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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-sm sm:text-base">
          {profile.display_name ? `Estantería de ${profile.display_name}` : "Tu estantería"}
        </h1>
        <NewBookButton />
      </div>

      {books.length === 0 ? (
        <div className="pixel-border flex flex-col items-center gap-6 bg-wood p-6 sm:p-10">
          <div className="w-full max-w-lg">
            <Guide
              animal="owl"
              scale={4}
              text="Tu estantería está vacía. Pulsa “Nuevo libro” y escribe el nombre de alguien importante: cada persona es un libro y cada sección, un capítulo."
              closable={false}
            />
          </div>
          <div className="h-3 w-full bg-wood-dark" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Shelf books={books} />
          <UpcomingDates dates={upcoming} />
        </div>
      )}
    </div>
  );
}
