import { notFound } from "next/navigation";
import { AnecdotesChapter } from "@/components/book/chapters/anecdotes";
import { DatesChapter } from "@/components/book/chapters/dates";
import { GiftsChapter } from "@/components/book/chapters/gifts";
import { PreferencesChapter } from "@/components/book/chapters/preferences";
import { RemindersList } from "@/components/book/chapters/reminders";
import { CHAPTERS } from "@/lib/constants";
import {
  getAnecdotes,
  getBook,
  getCategories,
  getDates,
  getGifts,
  getPreferences,
  getReminders,
} from "@/lib/data";

export default async function ChapterPage({ params, searchParams }: PageProps<"/libro/[id]/[capitulo]">) {
  const { id, capitulo } = await params;
  const sp = await searchParams;
  const number = CHAPTERS.findIndex((c) => c.slug === capitulo) + 1;
  if (number === 0) notFound();

  const { person, profile } = await getBook(id);

  switch (capitulo) {
    case "gustos":
    case "disgustos": {
      const kind = capitulo === "gustos" ? "like" : "dislike";
      const [items, categories] = await Promise.all([getPreferences(person.id, kind), getCategories()]);
      return (
        <PreferencesChapter
          kind={kind}
          items={items}
          categories={categories}
          personId={person.id}
          editable
          number={number}
          firstTime={sp.primera === "1" && items.length === 0}
        />
      );
    }
    case "anecdotas": {
      const items = await getAnecdotes(person.id);
      return (
        <AnecdotesChapter
          items={items}
          personId={person.id}
          editable
          number={number}
          prefill={typeof sp.nueva === "string" ? sp.nueva.slice(0, 120) : undefined}
        />
      );
    }
    case "fechas": {
      const items = await getDates(person.id);
      return <DatesChapter items={items} personId={person.id} editable number={number} />;
    }
    case "regalos": {
      const { gifts, likes, dates } = await getGifts(person.id);
      return (
        <GiftsChapter items={gifts} likes={likes} dates={dates} personId={person.id} editable number={number} />
      );
    }
    case "recordatorios": {
      const items = await getReminders({ personId: person.id });
      return (
        <RemindersList
          items={items}
          personId={person.id}
          timezone={profile.timezone}
          defaultChannels={profile.default_reminder_channels}
          now={new Date().toISOString()}
          editable
          number={number}
        />
      );
    }
    default:
      notFound();
  }
}
