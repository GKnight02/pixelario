"use client";

import type { Person } from "@/lib/types";
import { deletePerson } from "@/lib/actions/people";
import { ActionButton } from "../pixel/form";
import { PixelLink } from "../pixel/pixel-button";
import { SheetTrigger } from "../pixel/sheet";
import { PersonForm } from "../shelf/person-form";
import { PdfExport } from "./pdf-export";

export function CoverActions({ person, avatarUrl }: { person: Person; avatarUrl: string | null }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <SheetTrigger label="Editar portada" title="Editar portada" icon="pencil" variant="paper">
        {(close) => <PersonForm person={person} avatarUrl={avatarUrl} onDone={close} />}
      </SheetTrigger>
      <PixelLink href={`/libro/${person.id}/compartir`} icon="share">
        Compartir
      </PixelLink>
      <PdfExport personId={person.id} name={person.name} />
      <form action={deletePerson}>
        <input type="hidden" name="id" value={person.id} />
        <ActionButton
          icon="trash"
          variant="berry"
          size="md"
          confirm={`¿Borrar el libro de ${person.name} con todo su contenido? No se puede deshacer.`}
        >
          Borrar
        </ActionButton>
      </form>
    </div>
  );
}
