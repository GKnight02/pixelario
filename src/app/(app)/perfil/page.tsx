import type { Metadata } from "next";
import { DangerZone, ProfileForm } from "@/components/layout/profile-form";
import { PixelCard } from "@/components/pixel/pixel-card";
import { getProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const [{ user }, profile] = await Promise.all([requireUser(), getProfile()]);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-sm">Perfil</h1>
      <PixelCard className="p-5">
        <ProfileForm profile={profile} email={user.email ?? ""} timezones={Intl.supportedValuesOf("timeZone")} />
      </PixelCard>
      <PixelCard className="p-5">
        <DangerZone />
      </PixelCard>
    </div>
  );
}
