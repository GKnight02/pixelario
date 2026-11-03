import type { Metadata } from "next";
import Link from "next/link";
import { AuthorBook } from "@/components/book/author-book";
import { chapterLinks } from "@/components/book/book-shell";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { getBook } from "@/lib/data";

export async function generateMetadata({ params }: LayoutProps<"/libro/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { person } = await getBook(id);
  return { title: `El libro de ${person.name}` };
}

export default async function BookLayout({ children, params }: LayoutProps<"/libro/[id]">) {
  const { id } = await params;
  const { person, counts } = await getBook(id);

  return (
    <div className="flex flex-col gap-3">
      <Link href="/estanteria" className="flex w-fit items-center gap-2 text-sm hover:underline">
        <PixelIcon name="left" scale={1.5} /> Volver a la estantería
      </Link>
      <AuthorBook
        personId={person.id}
        name={person.name}
        coverColor={person.cover_color}
        chapters={chapterLinks(counts)}
        leftExtra={
          <Link
            href={`/libro/${person.id}/compartir`}
            className="flex items-center gap-2 text-sm underline decoration-2 underline-offset-4"
          >
            <PixelIcon name="share" scale={1.5} /> Compartir este libro
          </Link>
        }
      >
        {children}
      </AuthorBook>
    </div>
  );
}
