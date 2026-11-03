"use client";

import { SheetTrigger } from "../pixel/sheet";
import { PersonForm } from "./person-form";

export function NewBookButton() {
  return (
    <SheetTrigger label="Nuevo libro" title="Nuevo libro" icon="plus">
      {(close) => <PersonForm onDone={close} />}
    </SheetTrigger>
  );
}
