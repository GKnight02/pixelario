"use client";

import { useState } from "react";
import { CHAPTERS } from "@/lib/constants";
import type { PublicBook } from "@/lib/types";
import { Guide } from "../guides/guide";
import { BookShell, ChapterIndex, type ChapterLink } from "./book-shell";
import { AnecdotesChapter } from "./chapters/anecdotes";
import { DatesChapter } from "./chapters/dates";
import { GiftsChapter } from "./chapters/gifts";
import { PreferencesChapter } from "./chapters/preferences";
import { RemindersList } from "./chapters/reminders";
import { Cover } from "./cover";

/** El mismo libro en modo lectura para visitantes del link público. */
export function PublicBookView({ book, now }: { book: PublicBook; now: string }) {
  const visible = CHAPTERS.filter((c) => book.sections[c.key]);
  const chapters: ChapterLink[] = [
    { slug: "", title: "Portada", short: "Portada", icon: "books" },
    ...visible.map((c) => ({ slug: c.slug, title: c.title, short: c.short, icon: c.icon })),
  ];
  const [current, setCurrent] = useState("");
  const tz = "UTC"; // el visitante no tiene perfil: horas en UTC

  let content: React.ReactNode = null;
  switch (current) {
    case "":
      content = (
        <div className="flex flex-col gap-6">
          <Guide
            animal="rabbit"
            text={`¡Hola! Este es el libro de ${book.person.name}${
              book.author ? `, escrito por ${book.author}` : ""
            }. Pasa las páginas con las flechas, deslizando o desde el índice.`}
          />
          <Cover
            name={book.person.name}
            nickname={book.person.nickname}
            relationship={book.person.relationship}
            tagline={book.person.tagline}
            coverColor={book.person.cover_color}
            avatarUrl={book.avatarSignedUrl}
            author={book.author}
          />
          <section className="lg:hidden" aria-labelledby="indice">
            <h2 id="indice" className="mb-3 text-[2rem]">
              Índice
            </h2>
            <ChapterIndex chapters={chapters.slice(1)} current="" onSelect={setCurrent} />
          </section>
        </div>
      );
      break;
    case "gustos":
      content = <PreferencesChapter kind="like" items={book.likes ?? []} editable={false} />;
      break;
    case "disgustos":
      content = <PreferencesChapter kind="dislike" items={book.dislikes ?? []} editable={false} />;
      break;
    case "anecdotas":
      content = <AnecdotesChapter items={book.anecdotes ?? []} editable={false} />;
      break;
    case "fechas":
      content = <DatesChapter items={book.dates ?? []} editable={false} />;
      break;
    case "regalos":
      content = <GiftsChapter items={book.gifts ?? []} editable={false} />;
      break;
    case "recordatorios":
      content = <RemindersList items={book.reminders ?? []} editable={false} timezone={tz} now={now} />;
      break;
  }

  return (
    <BookShell
      title={book.person.name}
      coverColor={book.person.cover_color}
      chapters={chapters}
      current={current}
      onNavigate={(slug) => {
        setCurrent(slug);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {content}
    </BookShell>
  );
}
