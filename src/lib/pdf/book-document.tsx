import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { join } from "node:path";
import { dateTypeLabel, getMood, GIFT_STATUSES, MONTHS, REPEATS } from "../constants";
import type { AnecdoteView, ImportantDate, Person, PreferenceView } from "../types";

let fontsRegistered = false;
export function registerPdfFonts() {
  if (fontsRegistered) return;
  const dir = join(process.cwd(), "public", "fonts");
  Font.register({ family: "PressStart", src: join(dir, "PressStart2P-Regular.ttf") });
  Font.register({ family: "Pixelify", src: join(dir, "PixelifySans.ttf") });
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const C = {
  paper: "#F4E4C1",
  ink: "#3B2A1A",
  soft: "#6B5440",
  accent: "#E0A030",
  leaf: "#5A8F4E",
  berry: "#B04A5A",
};

const s = StyleSheet.create({
  page: { backgroundColor: C.paper, color: C.ink, fontFamily: "Pixelify", fontSize: 12, padding: 40, paddingBottom: 56 },
  frame: { position: "absolute", top: 16, left: 16, right: 16, bottom: 16, borderWidth: 3, borderColor: C.ink },
  title: { fontFamily: "PressStart", fontSize: 16, marginBottom: 14, lineHeight: 1.5 },
  h3: { fontFamily: "PressStart", fontSize: 8, color: C.soft, marginTop: 10, marginBottom: 6 },
  card: { borderWidth: 2, borderColor: C.ink, padding: 8, marginBottom: 8, backgroundColor: "#FFF8E6" },
  bold: { fontWeight: 700, fontSize: 13 },
  soft: { color: C.soft, fontSize: 10 },
  footer: { position: "absolute", bottom: 26, left: 0, right: 0, textAlign: "center", fontFamily: "PressStart", fontSize: 7, color: C.soft },
  row: { flexDirection: "row", alignItems: "center" },
});

/** Ícono pixel dibujado con cuadritos. */
function PixelHeart({ size = 3, color = C.berry }: { size?: number; color?: string }) {
  const map = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
  return (
    <View>
      {map.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {[...row].map((c, x) => (
            <View key={x} style={{ width: size, height: size, backgroundColor: c === "#" ? color : "transparent" }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Hearts({ n, kind }: { n: number; kind: "like" | "dislike" }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ opacity: i <= n ? 1 : 0.2 }}>
          <PixelHeart size={1.6} color={kind === "like" ? C.berry : C.ink} />
        </View>
      ))}
    </View>
  );
}

function Divider() {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginVertical: 10 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={{ width: 4, height: 4, backgroundColor: i % 2 ? C.accent : C.ink }} />
      ))}
    </View>
  );
}

function ChapterPage({ title, number, children }: { title: string; number: number; children: React.ReactNode }) {
  return (
    <Page size="A5" style={s.page} wrap>
      <View style={s.frame} fixed />
      <Text style={[s.soft, { fontFamily: "PressStart", fontSize: 7 }]}>CAPÍTULO {number}</Text>
      <Text style={s.title}>{title}</Text>
      {children}
      <Text style={s.footer} render={({ pageNumber }) => `· ${pageNumber} ·`} fixed />
    </Page>
  );
}

function Preferences({ items, kind }: { items: PreferenceView[]; kind: "like" | "dislike" }) {
  if (!items.length) return <Text style={s.soft}>Capítulo en blanco.</Text>;
  const groups = new Map<string, PreferenceView[]>();
  for (const i of items) groups.set(i.category_name ?? "Sin categoría", [...(groups.get(i.category_name ?? "Sin categoría") ?? []), i]);
  return (
    <>
      {[...groups.entries()].map(([cat, list]) => (
        <View key={cat} wrap={false}>
          <Text style={s.h3}>{cat.toUpperCase()}</Text>
          {list.map((p) => (
            <View key={p.id} style={s.card}>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={s.bold}>{p.title}</Text>
                <Hearts n={p.intensity} kind={kind} />
              </View>
              {p.note ? <Text style={{ marginTop: 3 }}>{p.note}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

export interface PdfBookData {
  person: Person;
  avatarUrl: string | null;
  author: string | null;
  chapters: string[];
  likes?: PreferenceView[];
  dislikes?: PreferenceView[];
  anecdotes?: AnecdoteView[];
  dates?: ImportantDate[];
  gifts?: { title: string; status: string; price_estimate: number | null; note: string | null }[];
  reminders?: { title: string; when: string; repeat: string; note: string | null }[];
}

const TITLES: Record<string, string> = {
  gustos: "Le gusta",
  disgustos: "No le gusta",
  anecdotas: "Anécdotas",
  fechas: "Fechas importantes",
  regalos: "Ideas de regalo",
  recordatorios: "Recordatorios",
};

export function BookDocument(data: PdfBookData) {
  const { person } = data;
  const chapters = data.chapters;
  return (
    <Document title={`El libro de ${person.name}`} author={data.author ?? "Pixelario"} creator="Pixelario">
      {/* Portada */}
      <Page size="A5" style={[s.page, { backgroundColor: person.cover_color, color: "#FDF6E3", justifyContent: "center", alignItems: "center" }]}>
        <View style={[s.frame, { borderColor: C.accent, borderStyle: "dashed" }]} />
        <Text style={{ fontFamily: "PressStart", fontSize: 9, marginBottom: 18 }}>EL LIBRO DE</Text>
        <View style={{ width: 110, height: 110, borderWidth: 5, borderColor: "#2A1A10", backgroundColor: C.paper, justifyContent: "center", alignItems: "center", marginBottom: 18 }}>
          {data.avatarUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.avatarUrl} style={{ width: 100, height: 100, objectFit: "cover" }} />
          ) : (
            <PixelHeart size={9} />
          )}
        </View>
        <Text style={{ fontFamily: "PressStart", fontSize: 18, textAlign: "center", lineHeight: 1.5 }}>{person.name}</Text>
        {person.nickname ? <Text style={{ fontSize: 14, marginTop: 6 }}>“{person.nickname}”</Text> : null}
        <Text style={{ fontSize: 12, marginTop: 10, borderWidth: 2, borderColor: "#FDF6E3", paddingHorizontal: 8, paddingVertical: 3 }}>
          {person.relationship}
        </Text>
        {person.tagline ? <Text style={{ fontSize: 13, marginTop: 14, textAlign: "center", maxWidth: 260 }}>{person.tagline}</Text> : null}
        {data.author ? <Text style={{ fontSize: 10, marginTop: 30, opacity: 0.85 }}>Escrito por {data.author}</Text> : null}
      </Page>

      {/* Índice */}
      <Page size="A5" style={s.page}>
        <View style={s.frame} />
        <Text style={s.title}>Índice</Text>
        {chapters.map((c, i) => (
          <View key={c} style={[s.row, { borderBottomWidth: 1, borderBottomColor: C.soft, borderBottomStyle: "dotted", paddingVertical: 6 }]}>
            <Text style={{ fontFamily: "PressStart", fontSize: 8, width: 24 }}>{i + 1}</Text>
            <Text style={{ fontSize: 14 }}>{TITLES[c]}</Text>
          </View>
        ))}
        <Divider />
        <Text style={[s.soft, { textAlign: "center" }]}>Hecho con Pixelario</Text>
      </Page>

      {chapters.map((c, i) => {
        const n = i + 1;
        switch (c) {
          case "gustos":
            return (
              <ChapterPage key={c} title={TITLES[c]} number={n}>
                <Preferences items={data.likes ?? []} kind="like" />
              </ChapterPage>
            );
          case "disgustos":
            return (
              <ChapterPage key={c} title={TITLES[c]} number={n}>
                <Preferences items={data.dislikes ?? []} kind="dislike" />
              </ChapterPage>
            );
          case "anecdotas":
            return (
              <ChapterPage key={c} title={TITLES[c]} number={n}>
                {(data.anecdotes ?? []).length === 0 ? <Text style={s.soft}>Aún no hay recuerdos.</Text> : null}
                {(data.anecdotes ?? []).map((a) => (
                  <View key={a.id} style={s.card} wrap={false}>
                    <Text style={s.soft}>
                      {a.happened_on ? a.happened_on.split("-").reverse().join("/") : "Sin fecha"}
                      {a.place ? ` · ${a.place}` : ""}
                      {getMood(a.mood) ? ` · ${getMood(a.mood)!.label}` : ""}
                    </Text>
                    <Text style={[s.bold, { marginVertical: 3 }]}>{a.title}</Text>
                    {a.body ? <Text>{a.body}</Text> : null}
                    {a.photoUrls.length ? (
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {a.photoUrls.map((p, k) => (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <Image key={k} src={p.thumb} style={{ width: 80, height: 80, objectFit: "cover", borderWidth: 2, borderColor: C.ink }} />
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </ChapterPage>
            );
          case "fechas":
            return (
              <ChapterPage key={c} title={TITLES[c]} number={n}>
                {(data.dates ?? []).length === 0 ? <Text style={s.soft}>No hay fechas anotadas.</Text> : null}
                {(data.dates ?? []).map((d) => (
                  <View key={d.id} style={[s.card, s.row, { gap: 10 }]} wrap={false}>
                    <View style={{ borderWidth: 2, borderColor: C.ink, width: 44, alignItems: "center" }}>
                      <Text style={{ backgroundColor: C.berry, color: "#FDF6E3", width: "100%", textAlign: "center", fontFamily: "PressStart", fontSize: 6, paddingVertical: 2 }}>
                        {MONTHS[d.month - 1].slice(0, 3).toUpperCase()}
                      </Text>
                      <Text style={{ fontFamily: "PressStart", fontSize: 12, paddingVertical: 4 }}>{d.day}</Text>
                    </View>
                    <View>
                      <Text style={s.bold}>{d.label}</Text>
                      <Text style={s.soft}>
                        {dateTypeLabel(d.type)}
                        {d.year ? ` · ${d.year}` : ""}
                        {d.recurring ? " · cada año" : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </ChapterPage>
            );
          case "regalos":
            return (
              <ChapterPage key={c} title={TITLES[c]} number={n}>
                {(data.gifts ?? []).length === 0 ? <Text style={s.soft}>No hay ideas de regalo.</Text> : null}
                {(data.gifts ?? []).map((g, k) => (
                  <View key={k} style={s.card} wrap={false}>
                    <View style={[s.row, { justifyContent: "space-between" }]}>
                      <Text style={s.bold}>{g.title}</Text>
                      <Text style={s.soft}>{GIFT_STATUSES.find((x) => x.value === g.status)?.label}</Text>
                    </View>
                    {g.price_estimate !== null ? <Text style={s.soft}>≈ {g.price_estimate}</Text> : null}
                    {g.note ? <Text>{g.note}</Text> : null}
                  </View>
                ))}
              </ChapterPage>
            );
          case "recordatorios":
            return (
              <ChapterPage key={c} title={TITLES[c]} number={n}>
                {(data.reminders ?? []).length === 0 ? <Text style={s.soft}>No hay recordatorios pendientes.</Text> : null}
                {(data.reminders ?? []).map((r, k) => (
                  <View key={k} style={s.card} wrap={false}>
                    <Text style={s.bold}>{r.title}</Text>
                    <Text style={s.soft}>
                      {r.when}
                      {r.repeat !== "none" ? ` · ${REPEATS.find((x) => x.value === r.repeat)?.label}` : ""}
                    </Text>
                    {r.note ? <Text>{r.note}</Text> : null}
                  </View>
                ))}
              </ChapterPage>
            );
          default:
            return null;
        }
      })}
    </Document>
  );
}
