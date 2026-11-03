import type { Metadata } from "next";
import { Onboarding } from "@/components/layout/onboarding";
import { getProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function WelcomePage() {
  const profile = await getProfile();
  const timezones = Intl.supportedValuesOf("timeZone");
  return <Onboarding defaultName={profile.display_name ?? ""} timezones={timezones} />;
}
