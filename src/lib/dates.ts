import { MONTHS } from "./constants";
import type { ImportantDate, Repeat } from "./types";

export interface YMD {
  year: number;
  month: number; // 1-12
  day: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Partes de fecha/hora "de pared" en una zona horaria. */
export function wallParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Diferencia (ms) entre la hora de pared de la zona y UTC en un instante dado. */
function tzOffsetMs(date: Date, timeZone: string) {
  const w = wallParts(date, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Convierte una hora de pared en una zona horaria a un instante UTC. */
export function zonedTimeToUtc(
  ymd: YMD,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute);
  let result = guess - tzOffsetMs(new Date(guess), timeZone);
  // Segunda pasada para cambios de horario (DST).
  result = guess - tzOffsetMs(new Date(result), timeZone);
  return new Date(result);
}

export function todayIn(timeZone: string): YMD {
  const w = wallParts(new Date(), timeZone);
  return { year: w.year, month: w.month, day: w.day };
}

function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Ajusta 29 de febrero a 28 en años no bisiestos (y días fuera de rango). */
function clampDay(year: number, month: number, day: number) {
  if (month === 2 && day === 29 && !isLeap(year)) return 28;
  return Math.min(day, daysInMonth(year, month));
}

function ymdToEpochDay(d: YMD) {
  return Math.floor(Date.UTC(d.year, d.month - 1, d.day) / DAY_MS);
}

export function diffDays(from: YMD, to: YMD) {
  return ymdToEpochDay(to) - ymdToEpochDay(from);
}

export function addDays(d: YMD, n: number): YMD {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day) + n * DAY_MS);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

/** Próxima ocurrencia (hoy incluido) de una fecha importante, o null si ya pasó y no se repite. */
export function nextOccurrence(
  date: Pick<ImportantDate, "month" | "day" | "year" | "recurring">,
  today: YMD,
): YMD | null {
  if (!date.recurring && date.year) {
    const only = { year: date.year, month: date.month, day: clampDay(date.year, date.month, date.day) };
    return diffDays(today, only) >= 0 ? only : null;
  }
  let year = today.year;
  let candidate = { year, month: date.month, day: clampDay(year, date.month, date.day) };
  if (diffDays(today, candidate) < 0) {
    year += 1;
    candidate = { year, month: date.month, day: clampDay(year, date.month, date.day) };
  }
  return candidate;
}

export function daysUntil(
  date: Pick<ImportantDate, "month" | "day" | "year" | "recurring">,
  today: YMD,
): number | null {
  const next = nextOccurrence(date, today);
  return next ? diffDays(today, next) : null;
}

export function countdownText(days: number | null) {
  if (days === null) return "ya pasó";
  if (days === 0) return "¡es hoy!";
  if (days === 1) return "falta 1 día";
  return `faltan ${days} días`;
}

/** Edad que cumple en la próxima ocurrencia (si hay año). */
export function turningAge(date: Pick<ImportantDate, "year">, next: YMD | null) {
  if (!date.year || !next) return null;
  return next.year - date.year;
}

export function formatDayMonth(month: number, day: number, year?: number | null) {
  return `${day} de ${MONTHS[month - 1]}${year ? ` de ${year}` : ""}`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return formatDayMonth(m, d, y);
}

export function formatDateTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("es", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Valor para <input type="datetime-local"> en la zona del usuario. */
export function toDateTimeLocal(iso: string, timeZone: string) {
  const w = wallParts(new Date(iso), timeZone);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.year}-${p(w.month)}-${p(w.day)}T${p(w.hour)}:${p(w.minute)}`;
}

/** Interpreta un "YYYY-MM-DDTHH:mm" como hora local del usuario. */
export function fromDateTimeLocal(value: string, timeZone: string): Date {
  const [datePart, timePart = "09:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return zonedTimeToUtc({ year, month, day }, hour, minute, timeZone);
}

/** Avanza un recordatorio repetido manteniendo la hora de pared local. */
export function advanceDueAt(dueAtIso: string, repeat: Repeat, timeZone: string, from = new Date()): Date {
  if (repeat === "none") return new Date(dueAtIso);
  let current = new Date(dueAtIso);
  // Avanza al menos una vez y hasta quedar en el futuro.
  do {
    const w = wallParts(current, timeZone);
    let ymd: YMD = { year: w.year, month: w.month, day: w.day };
    if (repeat === "weekly") ymd = addDays(ymd, 7);
    if (repeat === "monthly") {
      const month = w.month === 12 ? 1 : w.month + 1;
      const year = w.month === 12 ? w.year + 1 : w.year;
      ymd = { year, month, day: Math.min(w.day, daysInMonth(year, month)) };
    }
    if (repeat === "yearly") {
      ymd = { year: w.year + 1, month: w.month, day: clampDay(w.year + 1, w.month, w.day) };
    }
    current = zonedTimeToUtc(ymd, w.hour, w.minute, timeZone);
  } while (current.getTime() <= from.getTime());
  return current;
}

/** Calcula los recordatorios automáticos de una fecha importante. */
export function remindersForDate(
  date: Pick<ImportantDate, "month" | "day" | "year" | "recurring" | "remind_days_before">,
  timeZone: string,
  hour = 9,
): { daysBefore: number; dueAt: Date }[] {
  const today = todayIn(timeZone);
  const out: { daysBefore: number; dueAt: Date }[] = [];
  for (const n of date.remind_days_before) {
    let occ = nextOccurrence(date, today);
    if (!occ) continue;
    let reminderDay = addDays(occ, -n);
    if (diffDays(today, reminderDay) < 0) {
      if (!date.recurring) continue;
      // El aviso de este año ya pasó: programarlo para la siguiente ocurrencia.
      occ = nextOccurrence(date, addDays(occ, 1));
      if (!occ) continue;
      reminderDay = addDays(occ, -n);
    }
    out.push({ daysBefore: n, dueAt: zonedTimeToUtc(reminderDay, hour, 0, timeZone) });
  }
  return out;
}
