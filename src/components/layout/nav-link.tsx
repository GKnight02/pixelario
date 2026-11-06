"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "../pixel/pixel-icon";

/** Pestaña de la barra cobalto: la activa es de esmalte y "baja" hasta el contenido. */
export function NavLink({
  href,
  icon,
  label,
  ariaLabel,
  leading,
  badge,
}: {
  href: string;
  icon?: string;
  label: string;
  ariaLabel?: string;
  leading?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={ariaLabel}
      className={`relative flex min-h-11 items-center gap-1.5 px-1.5 font-title text-[0.6rem] transition-colors duration-150 sm:px-3.5 ${
        active
          ? "mt-2 bg-glaze text-ink"
          : "text-on-bar/85 hover:bg-on-bar/12 hover:text-on-bar"
      }`}
    >
      {leading ?? (icon ? <PixelIcon name={icon} scale={2} /> : null)}
      <span className="hidden max-w-[16ch] truncate lg:inline">{label}</span>
      {badge}
    </Link>
  );
}
