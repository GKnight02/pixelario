# Pixelario

**Libro de Personas en pixel art.** Cada usuario escribe un libro sobre las personas importantes de su vida: qué les gusta, qué no, las anécdotas compartidas, sus fechas importantes y recordatorios para cuidarlas mejor.

No es una red social: no hay feed, likes ni seguidores. Cada persona es un libro en una estantería y cada sección es un capítulo que se abre pasando páginas. Un búho, un gato, un zorro, una tortuga y un conejo acompañan al usuario.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Base de datos | Supabase (PostgreSQL) con Row Level Security |
| Autenticación | Supabase Auth: email + contraseña, enlace mágico y Google |
| Archivos | Supabase Storage (bucket privado `photos`) |
| Estilos | Tailwind CSS v4, tema día/noche con variables CSS |
| Animaciones | Motion + sprites CSS con `steps()` |
| Validación | Zod en cada Server Action |
| Correos | Resend + React Email |
| Tareas programadas | Vercel Cron Jobs |
| PDF | `@react-pdf/renderer` |
| Fuentes | Press Start 2P (títulos) y Pixelify Sans (texto) |

## Funcionalidades

- **Estantería** con buscador, orden por nombre, última edición o próximo cumpleaños, y panel de "Próximas fechas".
- **Libro** con portada (avatar, relación, frase y cuenta regresiva), índice y paso de página animado: doble página en escritorio, índice desplegable en tablet y marcapáginas con swipe en móvil.
- **Capítulos**: Le gusta / No le gusta (categorías, intensidad de 1 a 3, mover entre ambos guardando la fecha), Anécdotas (línea de tiempo por año, stickers de ánimo, hasta 4 fotos, filtro pixelado), Fechas importantes (cumpleaños sin año, recordatorios automáticos a 7 días y el mismo día), Ideas de regalo (vinculadas a gustos y fechas, sugerencias del zorro, anécdota al regalar) y Recordatorios (repetición, canales app/correo, posponer).
- **Link público** `/l/<token>` de solo lectura con capítulos elegibles, anécdotas privadas, expiración, regenerar/desactivar, contador de visitas, `noindex` e imagen Open Graph pixel.
- **Exportar a PDF** con selección de capítulos.
- **Modo noche con vela**, `prefers-reduced-motion`, exportación de datos en JSON y eliminación de la cuenta.

## Puesta en marcha local

Requisitos: Node.js 20 o superior y una cuenta de [Supabase](https://supabase.com).

```bash
npm install
cp .env.example .env.local   # completa las variables
npm run dev
```

### 1. Supabase

1. Crea un proyecto en Supabase.
2. Aplica la migración `supabase/migrations/20261102000000_init.sql`, que crea las 9 tablas, RLS, `get_public_book`, el bucket `photos` y sus políticas. Tienes dos formas:
   - Con la CLI:
     ```bash
     npx supabase init          # solo la primera vez (no toca supabase/migrations)
     npx supabase link --project-ref <tu-ref>
     npx supabase db push
     ```
   - O pegando el archivo SQL en **SQL Editor** del panel de Supabase.
3. En **Authentication → URL Configuration**:
   - *Site URL*: `http://localhost:3000` en desarrollo (luego, la URL de Vercel).
   - *Redirect URLs*: `http://localhost:3000/auth/callback` y `https://<tu-dominio>/auth/callback`.
4. Para entrar con Google, activa el proveedor en **Authentication → Providers → Google** con tus credenciales OAuth.
5. Copia la URL del proyecto, la clave `anon`/publishable y la `service_role` en `.env.local`.

### 2. Variables de entorno

| Variable | Dónde se usa | Pública |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron y firma de fotos públicas | **No** |
| `RESEND_API_KEY` | Envío de correos | No |
| `EMAIL_FROM` | Remitente, p. ej. `Pixelario <hola@tudominio.com>` | No |
| `CRON_SECRET` | Protege `/api/cron/*` | No |
| `NEXT_PUBLIC_SITE_URL` | Links absolutos y Open Graph | Sí |

> `SUPABASE_SERVICE_ROLE_KEY` salta las políticas RLS: solo se usa en el servidor (cron y URLs firmadas de fotos ya autorizadas por `get_public_book`). Nunca la expongas en código de cliente.

## Deploy en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel, importa el repositorio (detecta Next.js automáticamente).
3. Configura las variables de entorno de la tabla anterior (o conecta Supabase desde el Marketplace de Vercel).
4. Añade la URL de producción a las *Redirect URLs* de Supabase Auth.
5. Verifica tu dominio en Resend.
6. El cron ya está declarado en `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }
```

Corre cada hora y envía los recordatorios cuya hora local ya llegó y que aún no tienen `last_sent_at`. Vercel envía `Authorization: Bearer <CRON_SECRET>` automáticamente. **Si tu plan solo permite una ejecución diaria**, cambia el schedule a `0 13 * * *` (8:00 en Perú): enviará todo lo vencido ese día.

Cada push a `main` despliega a producción y cada pull request genera una URL de vista previa.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Comprobación de tipos |
| `npm run sprites` | Regenera los sprite sheets de `public/sprites` |
| `npm run db:push` | Aplica migraciones con la CLI de Supabase |

## Estructura

```
src/
  app/
    (public)/            landing, login, registro
    (app)/               rutas protegidas del autor
      estanteria/  bienvenida/  libro/[id]/  recordatorios/  perfil/
    l/[token]/           vista pública + opengraph-image
    api/                 cron/reminders, pdf/[id], export
    auth/callback/       intercambio de código OAuth / magic link
  components/
    book/                BookShell (índice, paso de página), Cover, capítulos, SharePanel
    shelf/               Shelf, BookSpine, PersonForm, UpcomingDates
    pixel/               PixelButton, PixelCard, Stamp, Candle, Sheet, íconos
    guides/              Sprite, Guide + SpeechBubble, TurtleLoader, SleepingCat
  lib/
    supabase/            clientes de servidor, navegador, admin y proxy
    actions/             Server Actions por entidad
    validation/          esquemas Zod
    email/               plantilla React Email
    pdf/                 documento @react-pdf
  proxy.ts               refresco de sesión y protección de rutas
public/
  sprites/               sprite sheets de los personajes (32×32 por cuadro)
  fonts/                 TTF para el PDF y la imagen Open Graph (licencia OFL)
supabase/migrations/     SQL de tablas, RLS y funciones
scripts/                 generador de sprites
```

## Personajes y sprites

Cada personaje es un PNG de 128×96 px: 4 cuadros de 32×32 en 3 filas (`idle`, `talk` y un estado especial: dormir, correr, caminar o saltar). Los sprites incluidos se generan con `npm run sprites` a partir de mapas de píxeles en `scripts/generate-sprites.mjs`. Puedes reemplazarlos por arte hecho en Aseprite o Piskel manteniendo el mismo formato de hoja.

| Personaje | Dónde aparece |
| --- | --- |
| Búho bibliotecario | Bienvenida, onboarding, estantería vacía |
| Gato | Capítulos vacíos (duerme; al tocarlo sugiere qué escribir), libro cerrado |
| Zorro mensajero | Contador de recordatorios, bandeja, sugerencias de regalo |
| Tortuga | Pantallas de carga y exportación a PDF |
| Conejo | Bienvenida a los visitantes del link público |

## Privacidad y seguridad

- Todo es privado por defecto: RLS en todas las tablas y el acceso anónimo solo pasa por `get_public_book` (`security definer`).
- Tokens de link con `gen_random_bytes(24)`; regenerar invalida el anterior.
- Ideas de regalo y recordatorios ocultos por defecto en el link público; las anécdotas pueden marcarse como privadas.
- Fotos en un bucket privado con ruta `<owner_id>/<person_id>/<archivo>`, redimensionadas en el navegador (máx. 1600 px, con miniatura de 480 px) y límite de 5 MB. Se sirven con URLs firmadas de corta duración.
- Límite de solicitudes en la página pública. Está en memoria, así que es de mejor esfuerzo en serverless; para algo estricto, usa Vercel Firewall o Upstash Ratelimit.
- El endpoint del cron exige `Authorization: Bearer <CRON_SECRET>`.

## Mejoras futuras

- PWA con notificaciones push como tercer canal de recordatorios.
- Sonidos 8-bit opcionales.
- Plantillas de preguntas guiadas para inspirar al escribir.
- Libros colaborativos.
- Más idiomas con `next-intl`.

## Licencias

Las fuentes Press Start 2P y Pixelify Sans se distribuyen bajo la SIL Open Font License (ver `public/fonts/OFL-*.txt`).
