"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "../pixel/pixel-icon";

export function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-2 px-2 ${active ? "bg-wood-dark" : ""}`}
    >
      <PixelIcon name={icon} scale={2} />
      <span className="hidden max-w-[10ch] truncate text-sm sm:inline">{label}</span>
    </Link>
  );
}
