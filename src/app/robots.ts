import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Área privada y APIs fuera de los buscadores. Los libros públicos (/l/) llevan
      // noindex en la página, pero se dejan rastreables para que funcione la vista previa al compartir.
      disallow: ["/estanteria", "/libro/", "/recordatorios", "/perfil", "/bienvenida", "/api/"],
    },
  };
}
