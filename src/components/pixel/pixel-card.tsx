export function PixelCard({
  className = "",
  children,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article" | "li" }) {
  return (
    <Tag className={`pixel-border bg-paper p-5 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
