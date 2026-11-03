import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Todo excepto estáticos, imágenes, la vista pública y las APIs con su propia auth.
    "/((?!_next/static|_next/image|favicon.ico|sprites/|ui/|fonts/|l/|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)",
  ],
};
