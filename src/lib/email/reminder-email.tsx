import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ReminderEmailProps {
  name: string | null;
  siteUrl: string;
  reminders: {
    title: string;
    note: string | null;
    when: string;
    personName: string | null;
    personId: string | null;
    gifts: string[];
  }[];
}

const paper = "#F4E4C1";
const ink = "#3B2A1A";
const accent = "#E0A030";
const cover = "#8B3A3A";

/** Correo de recordatorios con estética de libro pixel. */
export function ReminderEmail({ name, siteUrl, reminders }: ReminderEmailProps) {
  const count = reminders.length;
  return (
    <Html lang="es">
      <Head />
      <Preview>
        {count === 1 ? reminders[0].title : `El zorro mensajero trae ${count} recordatorios`}
      </Preview>
      <Body style={{ background: "#2B2238", margin: 0, padding: "24px 0", fontFamily: "'Courier New', monospace" }}>
        <Container
          style={{
            background: paper,
            border: `4px solid ${ink}`,
            boxShadow: `6px 6px 0 0 #120c18`,
            maxWidth: 560,
            padding: 24,
            color: ink,
          }}
        >
          <Section style={{ background: cover, border: `3px solid ${ink}`, padding: "12px 16px", marginBottom: 20 }}>
            <Text style={{ color: "#FDF6E3", fontSize: 13, letterSpacing: 2, margin: 0, fontWeight: 700 }}>
              ✉ PIXELARIO · ZORRO MENSAJERO
            </Text>
          </Section>

          <Heading as="h1" style={{ fontSize: 20, margin: "0 0 12px" }}>
            {name ? `¡Hola, ${name}!` : "¡Hola!"}
          </Heading>
          <Text style={{ fontSize: 16, lineHeight: "24px" }}>
            {count === 1 ? "Te traigo un recordatorio:" : `Te traigo ${count} recordatorios:`}
          </Text>

          {reminders.map((r, i) => (
            <Section
              key={i}
              style={{
                border: `3px solid ${ink}`,
                background: "#FFF8E6",
                padding: "12px 14px",
                margin: "12px 0",
                boxShadow: `3px 3px 0 0 ${ink}`,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>{r.title}</Text>
              <Text style={{ fontSize: 14, margin: 0, color: "#6B5440" }}>
                {r.when}
                {r.personName ? ` · ${r.personName}` : ""}
              </Text>
              {r.note ? <Text style={{ fontSize: 15, margin: "8px 0 0" }}>{r.note}</Text> : null}
              {r.gifts.length ? (
                <>
                  <Hr style={{ borderColor: ink, borderStyle: "dashed", margin: "10px 0" }} />
                  <Text style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>🎁 Ideas de regalo pendientes:</Text>
                  {r.gifts.map((g) => (
                    <Text key={g} style={{ fontSize: 14, margin: "2px 0 0" }}>
                      ▪ {g}
                    </Text>
                  ))}
                </>
              ) : null}
              {r.personId ? (
                <Button
                  href={`${siteUrl}/libro/${r.personId}`}
                  style={{
                    background: accent,
                    color: "#2A1A10",
                    border: `3px solid ${ink}`,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: 10,
                  }}
                >
                  Abrir su libro
                </Button>
              ) : null}
            </Section>
          ))}

          <Button
            href={`${siteUrl}/recordatorios`}
            style={{
              background: ink,
              color: paper,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            Ver la bandeja
          </Button>

          <Hr style={{ borderColor: ink, margin: "24px 0 12px" }} />
          <Text style={{ fontSize: 12, color: "#6B5440", margin: 0 }}>
            Recibes este correo porque activaste los avisos por email en Pixelario. Puedes cambiarlo en tu perfil
            o en cada recordatorio.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ReminderEmail;
