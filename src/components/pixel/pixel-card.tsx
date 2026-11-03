export function PixelCard({
  className = "",
  children,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article" | "li" }) {
  return (
    <Tag className={`pixel-border paper p-4 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
