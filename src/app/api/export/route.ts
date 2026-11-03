import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Exporta todos los datos del usuario en JSON (RLS limita a sus filas). */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tables = [
    "profiles",
    "people",
    "categories",
    "preferences",
    "anecdotes",
    "important_dates",
    "gift_ideas",
    "reminders",
    "share_links",
  ] as const;

  const entries = await Promise.all(
    tables.map(async (t) => {
      let q = supabase.from(t).select("*");
      if (t === "categories") q = q.eq("owner_id", auth.user.id);
      const { data } = await q;
      return [t, data ?? []] as const;
    }),
  );

  const body = JSON.stringify(
    { exported_at: new Date().toISOString(), email: auth.user.email, ...Object.fromEntries(entries) },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pixelario-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
