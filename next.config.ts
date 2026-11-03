import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La app es casi toda privada por usuario (sesión en cookies), así que
  // trabajamos con renderizado dinámico clásico en lugar de Cache Components.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Las fuentes TTF se leen desde el sistema de archivos al generar el PDF
  // y la imagen Open Graph; nos aseguramos de que viajen con esas funciones.
  outputFileTracingIncludes: {
    "/api/pdf/[id]": ["./public/fonts/**"],
    "/l/[token]/opengraph-image": ["./public/fonts/**"],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
