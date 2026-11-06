# Pixelario

**Libro de Personas en pixel art.** Cada usuario escribe un libro sobre las personas importantes de su vida: qué les gusta, qué no, las anécdotas compartidas, sus fechas importantes y recordatorios para cuidarlas mejor.

No es una red social: no hay feed, likes ni seguidores. Cada persona es un libro en una estantería y cada sección es un capítulo que se abre pasando páginas. Un búho, un gato, un zorro, una tortuga y un conejo acompañan al usuario.

Visualmente, Pixelario es una pared de azulejos de talavera: esmalte blanco, trazo cobalto y toques de ocre. Cada persona recibe un **azulejo propio**, un patrón pixel de 8×8 con simetría de talavera que nace de su nombre y viste su lomo, su portada y su lugar en las listas.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Base de datos | Supabase (PostgreSQL) con Row Level Security |
| Autenticación | Supabase Auth: email + contraseña, enlace mágico y Google |
| Archivos | Supabase Storage (bucket privado `photos`) |
| Estilos | Tailwind CSS v4, tokens del tema día/noche en variables CSS (`src/app/globals.css`) |
| Animaciones | Motion (paso de página 3D, apertura del libro) + sprites CSS con `steps()` |
| Validación | Zod en cada Server Action |
| Correos | Resend + React Email |
| Tareas programadas | Vercel Cron Jobs |
| PDF | `@react-pdf/renderer` |
| Fuentes | Jersey 10 (títulos), Silkscreen (etiquetas y botones) y Pixelify Sans (texto) |

## Funcionalidades

- **Estantería** sobre una pared de azulejos: los libros se reacomodan en celdas enteras, con buscador y orden por nombre, última edición o próximo cumpleaños. El panel de **próxima fecha** muestra la siguiente en grande, en días, con una pista del búho hacia las ideas de regalo.
- **Libro**: al pulsar un lomo, el libro sale de la repisa y su tapa se abre girando sobre el lomo. Dentro hay portada (avatar, relación, frase y cuenta regresiva), índice y **paso de página en 3D**: la hoja gira con anverso y reverso, y se puede pasar con las flechas, el índice, el teclado, la esquina doblada o un swipe en móvil. Se ve a doble página en escritorio, con índice desplegable en tablet y marcapáginas en móvil.
- **Capítulos**:
  - *Le gusta / No le gusta*: bloques por categoría a dos columnas, filtro por categoría, intensidad de 1 a 3 y paso de uno a otro guardando la fecha.
  - *Anécdotas*: línea de tiempo por año, stickers de ánimo, hasta 4 fotos y filtro pixelado.
  - *Fechas importantes*: hojas de calendario ordenadas por cercanía, cumpleaños sin año y recordatorios automáticos a 7 días y el mismo día.
  - *Ideas de regalo*: tablero de tres columnas (idea, comprado, regalado), vinculadas a gustos y fechas, con sugerencias del zorro y una anécdota al regalar.
  - *Recordatorios*: repetición, canales app/correo, posponer y aviso de vencidos.
- **Link público** `/l/<token>` de solo lectura con capítulos elegibles, anécdotas privadas, expiración, regenerar/desactivar, contador de visitas, `noindex` e imagen Open Graph pixel.
- **Exportar a PDF** con selección de capítulos.
- **Modo noche con vela**: fondo cobalto profundo y halo de luz ocre, con la vela sobre un candelero de talavera como interruptor.
- `prefers-reduced-motion` (las animaciones se vuelven fundidos), exportación de datos en JSON y eliminación de la cuenta.

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
    book/                BookShell (apertura, índice, paso de página 3D), Cover, capítulos, SharePanel
    shelf/               Shelf, BookSpine, PersonForm, UpcomingDates
    pixel/               Azulejo, PixelButton, PixelCard, Stamp, Candle, Sheet, íconos
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

## Sistema visual

| Elemento | Detalle |
| --- | --- |
| Paleta | Esmalte `#f2f5fb` y cobalto `#1d3a9e` / `#0f1a4d` hacen todo el trabajo; ocre `#e8a31a`, verde `#2f8a4e` y terracota `#b8432f` solo marcan estado |
| Noche | Fondo `#121a47`, tinta clara y luz de vela `#ffb347` |
| Forma | Esquinas rectas, bordes de 3 px y sombras duras sin desenfoque |
| Ornamento | La cenefa (banda de rombos cobalto) en cabecera, modales e índice |
| Azulejo | `<Azulejo seed color />` dibuja el patrón de una persona; `<AzulejoField />` lo repite como paño en portadas y en el marco del libro |
| Movimiento | Curva `cubic-bezier(0.23, 1, 0.32, 1)` y menos de 300 ms en la interfaz; el paso de página dura unos 600 ms |

Los tokens viven en `src/app/globals.css`. Los nombres antiguos (`paper`, `ink`, `wood`…) se conservan como alias del tema.

## Personajes y sprites

Cada personaje es un PNG de 128×96 px: 4 cuadros de 32×32 en 3 filas (`idle`, `talk` y un estado especial: dormir, correr, caminar o saltar). Los sprites incluidos se generan con `npm run sprites` a partir de mapas de píxeles en `scripts/generate-sprites.mjs`, con la paleta de talavera: contorno cobalto, búho azul, gato ocre, zorro terracota, tortuga con caparazón de azulejo y conejo de esmalte. Puedes reemplazarlos por arte hecho en Aseprite o Piskel manteniendo el mismo formato de hoja.

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

Todas las fuentes se distribuyen bajo la SIL Open Font License:

- **En la web:** Jersey 10, Silkscreen y Pixelify Sans, cargadas con `next/font/google`.
- **En el PDF y la imagen Open Graph:** Press Start 2P y Pixelify Sans, incluidas como TTF en `public/fonts` (ver `public/fonts/OFL-*.txt`).
