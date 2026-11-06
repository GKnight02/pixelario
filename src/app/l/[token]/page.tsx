import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { PublicBookView } from "@/components/book/public-book";
import { Sprite } from "@/components/guides/sprite";
import { SpeechBubble } from "@/components/guides/guide";
import { ThemeToggle } from "@/components/pixel/theme-toggle";
import { getPublicBook } from "@/lib/public-book";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function allowed(token: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anon";
  return rateLimit(`${ip}:${token}`, 30, 60_000).ok;
}

export async function generateMetadata({ params }: PageProps<"/l/[token]">): Promise<Metadata> {
  const { token } = await params;
  const book = await getPublicBook(token);
  return {
    title: book ? `El libro de ${book.person.name}` : "Libro cerrado",
    description: book?.person.tagline ?? "Un libro de Pixelario",
    robots: { index: false, follow: false, nocache: true },
  };
}

function ClosedBook({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="pixel-border flex h-56 w-40 items-end justify-center bg-cover pb-4">
        <Sprite animal="cat" state="special" scale={3} />
      </div>
      <h1 className="text-[2.6rem]">Libro cerrado</h1>
      <div className="max-w-sm text-left">
        <SpeechBubble text={text} side="top" />
      </div>
      <Link href="/" className="underline">
        ¿Qué es Pixelario?
      </Link>
    </div>
  );
}

export default async function PublicBookPage({ params }: PageProps<"/l/[token]">) {
  const { token } = await params;

  if (!(await allowed(token))) {
    return (
      <Shell>
        <ClosedBook text="Zzz… demasiadas visitas seguidas. Vuelve a intentarlo en un minuto." />
      </Shell>
    );
  }

  const book = await getPublicBook(token);

  return (
    <Shell>
      {book ? (
        <PublicBookView book={book} now={new Date().toISOString()} />
      ) : (
        <ClosedBook text="Zzz… este link expiró o fue desactivado por su autor." />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-title text-[0.65rem]">
          Pixelario
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-8 sm:px-4">{children}</main>
    </div>
  );
}
