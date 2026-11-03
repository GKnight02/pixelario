"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { BookShell, type ChapterLink } from "./book-shell";

/** Libro del autor: la navegación entre capítulos son rutas. */
export function AuthorBook({
  personId,
  name,
  coverColor,
  chapters,
  leftExtra,
  children,
}: {
  personId: string;
  name: string;
  coverColor: string;
  chapters: ChapterLink[];
  leftExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  if (segment === "compartir") return <>{children}</>;

  return (
    <BookShell
      title={name}
      coverColor={coverColor}
      chapters={chapters}
      current={segment ?? ""}
      hrefFor={(slug) => `/libro/${personId}${slug ? `/${slug}` : ""}`}
      leftExtra={leftExtra}
    >
      {children}
    </BookShell>
  );
}
