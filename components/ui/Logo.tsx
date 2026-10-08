// Reflex brand logo.
// NOTE(client): this SVG is a vector stand-in for the supplied Reflex logo file.
// To use the original artwork, drop it into /public/brand/ and swap the <svg>
// below for <img src="/brand/your-logo.svg" alt="Reflex Interior and Construction" />.

type Props = {
  variant?: "full" | "mark" | "stacked";
  className?: string;
  title?: string;
};

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M5 43V18L24 5l19 13v25" />
        <path d="M15.5 43V21.5h10.5a6 6 0 0 1 0 12H15.5" />
        <path d="M23.5 33.5L32.5 43" />
      </g>
      <rect x="35" y="9" width="3" height="6.5" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ variant = "full", className, title = "Reflex Interior and Construction" }: Props) {
  if (variant === "mark") return <LogoMark className={className} />;
  const stacked = variant === "stacked";
  return (
    <span className={`logo ${stacked ? "logo--stacked" : ""} ${className ?? ""}`} role="img" aria-label={title}>
      <LogoMark className="logo__mark" />
      <span className="logo__type" aria-hidden="true">
        <span className="logo__word">REFLEX</span>
        <span className="logo__sub">Interior and Construction</span>
      </span>
    </span>
  );
}
