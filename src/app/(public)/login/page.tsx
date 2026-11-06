import type { Metadata } from "next";
import { Guide } from "@/components/guides/guide";
import { LoginForm } from "@/components/layout/auth-forms";
import { PixelCard } from "@/components/pixel/pixel-card";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-6">
      <Guide animal="owl" text="Bienvenido de vuelta. Tu estantería te está esperando." closable={false} />
      <PixelCard className="p-5">
        <h1 className="mb-6 text-[2.8rem]">Entrar</h1>
        <LoginForm next={typeof next === "string" ? next : undefined} error={typeof error === "string" ? error : undefined} />
      </PixelCard>
    </div>
  );
}
