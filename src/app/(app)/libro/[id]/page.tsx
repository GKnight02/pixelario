import { Cover } from "@/components/book/cover";
import { CoverActions } from "@/components/book/cover-actions";
import { ChapterIndex } from "@/components/book/book-shell";
import { chapterLinks } from "@/components/book/chapter-links";
import { dateTypeLabel } from "@/lib/constants";
import { countdownText } from "@/lib/dates";
import { getBook } from "@/lib/data";

export default async function BookCoverPage({ params }: PageProps<"/libro/[id]">) {
  const { id } = await params;
  const { person, avatarSignedUrl, nextDate, birthdayToday, counts } = await getBook(id);

  const countdown = nextDate
    ? {
        label: nextDate.type === "custom" ? nextDate.label : dateTypeLabel(nextDate.type),
        text: countdownText(nextDate.days),
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Cover
        name={person.name}
        nickname={person.nickname}
        relationship={person.relationship}
        tagline={person.tagline}
        coverColor={person.cover_color}
        avatarUrl={avatarSignedUrl}
        countdown={countdown}
        birthdayToday={birthdayToday}
      />
      <CoverActions person={person} avatarUrl={avatarSignedUrl} />

      {/* En móvil/tablet el índice se muestra bajo la portada */}
      <section className="lg:hidden" aria-labelledby="indice">
        <h2 id="indice" className="mb-2 text-[0.7rem]">
          Índice
        </h2>
        <ChapterIndex
          chapters={chapterLinks(counts).slice(1)}
          current=""
          basePath={`/libro/${person.id}`}
        />
      </section>
    </div>
  );
}
