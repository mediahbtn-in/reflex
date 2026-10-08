import Link from "next/link";
import Logo from "./Logo";
import { nav, services, site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__top">
        <div className="footer__brand">
          <Logo variant="stacked" />
          <p className="footer__tag">Building Better Tomorrows</p>
        </div>
        <nav className="footer__col" aria-label="Footer">
          <h2 className="eyebrow">Studio</h2>
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>
        <nav className="footer__col" aria-label="Services">
          <h2 className="eyebrow">Expertise</h2>
          {services.map((s) => (
            <Link key={s.slug} href={s.href}>{s.title}</Link>
          ))}
        </nav>
        <div className="footer__col">
          <h2 className="eyebrow">Contact</h2>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
          <span>{site.address}</span>
          <span>{site.hours}</span>
        </div>
      </div>
      <div className="wrap footer__bottom">
        <span>© {new Date().getFullYear()} Reflex Interior and Construction</span>
        <span className="mono">DESIGN · CONSTRUCT · TRANSFORM</span>
      </div>
    </footer>
  );
}
