import { z } from "zod";
import { CATEGORY_ICONS, MOODS } from "../constants";

/** Texto opcional: "" → null */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const requiredText = (max: number, msg = "Este campo es obligatorio") =>
  z.string().trim().min(1, msg).max(max, `Máximo ${max} caracteres`);

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

const uuid = z.string().uuid();
const optionalUuid = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.string().uuid().nullable());

export const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido");

// ---------- Auth ----------
export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  next: z.string().optional(),
});

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  next: z.string().optional(),
});

export const signupSchema = z.object({
  display_name: requiredText(60, "¿Cómo te llamas?"),
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// ---------- Perfil ----------
export const profileSchema = z.object({
  display_name: requiredText(60),
  timezone: z.string().min(1).max(64),
  theme: z.enum(["system", "day", "night"]),
  channel_app: checkbox,
  channel_email: checkbox,
});

export const onboardingSchema = z.object({
  display_name: requiredText(60, "¿Cómo te llamas?"),
  timezone: z.string().min(1).max(64),
  name: requiredText(80, "¿Sobre quién es tu primer libro?"),
  relationship: requiredText(40),
  cover_color: hexColor,
});

// ---------- Libros ----------
export const personSchema = z.object({
  name: requiredText(80, "El libro necesita un nombre"),
  nickname: optionalText(60),
  relationship: requiredText(40),
  cover_color: hexColor,
  tagline: optionalText(140),
  avatar_url: optionalText(400),
});

// ---------- Gustos ----------
export const preferenceSchema = z.object({
  person_id: uuid,
  kind: z.enum(["like", "dislike"]),
  title: requiredText(120, "¿Qué le gusta?"),
  note: optionalText(1000),
  intensity: z.coerce.number().int().min(1).max(3),
  category_id: optionalUuid,
});

export const categorySchema = z.object({
  name: requiredText(40, "Ponle nombre a la categoría"),
  icon: z.enum(CATEGORY_ICONS),
});

// ---------- Anécdotas ----------
export const anecdoteSchema = z.object({
  person_id: uuid,
  title: requiredText(120, "Ponle un título al recuerdo"),
  body: optionalText(5000),
  happened_on: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
  place: optionalText(120),
  mood: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.enum(MOODS.map((m) => m.value) as [string, ...string[]]).nullable()),
  photos: z
    .string()
    .optional()
    .transform((v) => (v ? (JSON.parse(v) as unknown) : []))
    .pipe(z.array(z.string().max(300)).max(4, "Máximo 4 fotos")),
  is_private: checkbox,
});

// ---------- Fechas ----------
export const importantDateSchema = z
  .object({
    person_id: uuid,
    type: z.enum(["birthday", "anniversary", "saint", "custom"]),
    label: requiredText(80),
    month: z.coerce.number().int().min(1).max(12),
    day: z.coerce.number().int().min(1).max(31),
    year: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .pipe(z.number().int().min(1900).max(2200).nullable()),
    recurring: checkbox,
    remind_7: checkbox,
    remind_1: checkbox,
    remind_0: checkbox,
  })
  .refine((d) => d.recurring || d.year !== null, {
    message: "Una fecha única necesita año",
    path: ["year"],
  })
  .refine(
    (d) => d.day <= new Date(Date.UTC(d.year ?? 2024, d.month, 0)).getUTCDate(),
    { message: "Ese día no existe en ese mes", path: ["day"] },
  );

// ---------- Regalos ----------
export const giftSchema = z.object({
  person_id: uuid,
  title: requiredText(120, "¿Cuál es la idea?"),
  price_estimate: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(",", ".")) : null))
    .pipe(z.number().min(0).max(1_000_000_000).nullable()),
  url: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().url("Link inválido").max(2000).nullable()),
  note: optionalText(1000),
  status: z.enum(["idea", "bought", "given"]),
  preference_id: optionalUuid,
  date_id: optionalUuid,
});

// ---------- Recordatorios ----------
export const reminderSchema = z
  .object({
    person_id: optionalUuid,
    title: requiredText(160, "¿Qué hay que recordar?"),
    note: optionalText(1000),
    due_local: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha y hora inválidas"),
    repeat: z.enum(["none", "weekly", "monthly", "yearly"]),
    channel_app: checkbox,
    channel_email: checkbox,
  })
  .refine((r) => r.channel_app || r.channel_email, {
    message: "Elige al menos un canal",
    path: ["channel_app"],
  });

// ---------- Compartir ----------
export const shareSettingsSchema = z.object({
  person_id: uuid,
  likes: checkbox,
  dislikes: checkbox,
  anecdotes: checkbox,
  dates: checkbox,
  gifts: checkbox,
  reminders: checkbox,
  expires_on: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
});

export const pdfChaptersSchema = z
  .array(z.enum(["gustos", "disgustos", "anecdotas", "fechas", "regalos", "recordatorios"]))
  .max(6);

export type FieldErrors = Record<string, string[] | undefined>;

export interface ActionState {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  /** Para animar el sello sólo tras un guardado nuevo */
  stamp?: number;
  data?: Record<string, unknown>;
}

export function zodErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
