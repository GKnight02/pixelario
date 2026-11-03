import { AppHeader } from "@/components/layout/app-header";
import { ThemeSync } from "@/components/pixel/theme-toggle";
import { getProfile, requireUser } from "@/lib/auth";
import { getPendingCount } from "@/lib/data";

export default async function AuthorLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const [profile, pending] = await Promise.all([getProfile(), getPendingCount()]);

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <ThemeSync pref={profile.theme} />
      <AppHeader pending={pending} name={profile.display_name} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-5 sm:px-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
