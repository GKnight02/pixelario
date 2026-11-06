import Link from "next/link";
import { PixelIcon } from "./pixel-icon";

type Variant = "primary" | "paper" | "leaf" | "berry" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-cobalt text-on-cobalt",
  paper: "bg-[var(--field)] text-ink",
  leaf: "bg-leaf text-on-cobalt",
  berry: "bg-terra text-on-cobalt",
  ghost: "bg-transparent text-ink shadow-none! border-dashed",
};

interface Common {
  variant?: Variant;
  icon?: string;
  className?: string;
  children?: React.ReactNode;
  size?: "sm" | "md";
}

export function buttonClasses(variant: Variant = "paper", size: "sm" | "md" = "md", extra = "") {
  return [
    "btn-pixel",
    VARIANTS[variant],
    size === "sm" ? "px-2.5! py-1.5! min-h-[38px]! text-[0.55rem]!" : "",
    extra,
  ].join(" ");
}

export function PixelButton({
  variant = "paper",
  icon,
  className = "",
  children,
  size = "md",
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {icon ? <PixelIcon name={icon} scale={size === "sm" ? 1.5 : 2} /> : null}
      {children}
    </button>
  );
}

export function PixelLink({
  variant = "paper",
  icon,
  className = "",
  children,
  size = "md",
  href,
  ...props
}: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {icon ? <PixelIcon name={icon} scale={size === "sm" ? 1.5 : 2} /> : null}
      {children}
    </Link>
  );
}
