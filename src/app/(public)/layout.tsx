import Link from "next/link";
import { ThemeToggle } from "@/components/pixel/theme-toggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-title text-xs sm:text-sm">
          Pixelario
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-12">{children}</main>
    </div>
  );
}
