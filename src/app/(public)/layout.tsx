import Link from "next/link";
import { ThemeToggle } from "@/components/pixel/theme-toggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <div aria-hidden className="cenefa" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="font-display text-[2.3rem] leading-none tracking-wide text-cobalt">
          PIXELARIO
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 sm:px-6">{children}</main>
      <div aria-hidden className="cenefa" />
    </div>
  );
}
