"use client";

import { useFormStatus } from "react-dom";
import { buttonClasses } from "./pixel-button";
import { PixelIcon } from "./pixel-icon";

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-title text-[0.6rem] text-ink">
      {children}
      {hint ? <span className="ml-1 font-sans text-[0.85rem] normal-case text-ink-soft">({hint})</span> : null}
    </label>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="mt-1 text-sm font-semibold text-berry">
      {errors[0]}
    </p>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`border-2 px-3 py-2 text-sm ${ok ? "border-leaf bg-leaf/12" : "border-terra bg-terra/12"}`}
    >
      {message}
    </p>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  icon,
  pendingText = "Guardando…",
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "primary" | "paper" | "leaf" | "berry";
  icon?: string;
  pendingText?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses(variant, size, className)}>
      {icon ? <PixelIcon name={icon} scale={size === "sm" ? 1.5 : 2} /> : null}
      {pending ? pendingText : children}
    </button>
  );
}

/** Botón dentro de un <form action={serverAction}> con confirmación opcional. */
export function ActionButton({
  children,
  icon,
  variant = "paper",
  confirm,
  title,
  size = "sm",
  className = "",
}: {
  children?: React.ReactNode;
  icon?: string;
  variant?: "primary" | "paper" | "leaf" | "berry" | "ghost";
  confirm?: string;
  title?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      title={title}
      aria-label={title}
      disabled={pending}
      className={buttonClasses(variant, size, className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {icon ? <PixelIcon name={icon} scale={1.5} /> : null}
      {children}
    </button>
  );
}
