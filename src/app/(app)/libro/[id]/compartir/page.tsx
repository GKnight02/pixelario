import Link from "next/link";
import { SharePanel } from "@/components/book/share-panel";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { wallParts } from "@/lib/dates";
import { getBook, getShareLink } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export default async function SharePage({ params }: PageProps<"/libro/[id]/compartir">) {
  const { id } = await params;
  const [{ person, profile }, link, siteUrl] = await Promise.all([getBook(id), getShareLink(id), getSiteUrl()]);

  let expiresOn = "";
  if (link?.expires_at) {
    const w = wallParts(new Date(link.expires_at), profile.timezone);
    expiresOn = `${w.year}-${String(w.month).padStart(2, "0")}-${String(w.day).padStart(2, "0")}`;
  }

  return (
    <div className="pixel-border paper mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link href={`/libro/${person.id}`} className="mb-4 flex w-fit items-center gap-2 text-sm hover:underline">
        <PixelIcon name="left" scale={1.5} /> Volver al libro
      </Link>
      <h1 className="mb-5 flex items-center gap-2 text-sm">
        <PixelIcon name="share" scale={2.5} /> Compartir el libro de {person.name}
      </h1>
      <SharePanel
        key={`${link?.token}-${link?.is_active}`}
        personId={person.id}
        personName={person.name}
        link={link}
        siteUrl={siteUrl}
        expiresOn={expiresOn}
      />
    </div>
  );
}
