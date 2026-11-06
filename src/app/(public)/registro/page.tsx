import type { Metadata } from "next";
import { Guide } from "@/components/guides/guide";
import { SignupForm } from "@/components/layout/auth-forms";
import { PixelCard } from "@/components/pixel/pixel-card";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-6">
      <Guide
        animal="owl"
        text="Cada persona importante merece un libro. Crea tu cuenta y empezamos el primero juntos."
        closable={false}
      />
      <PixelCard className="p-5">
        <h1 className="mb-6 text-[2.8rem]">Crear cuenta</h1>
        <SignupForm />
      </PixelCard>
    </div>
  );
}
