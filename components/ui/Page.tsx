import Link from "next/link";
import Reveal, { Lines } from "./Reveal";
import { PlanArt } from "./ArchIcons";

export function PageHero({ n, label, title, lead, crumb }: { n: string; label: string; title: React.ReactNode[]; lead: string; crumb: string }) {
  return (
    <header className="phero">
      <div className="phero__grid" aria-hidden="true" />
      <div className="phero__plan" aria-hidden="true">
        <Reveal>
          <PlanArt />
        </Reveal>
      </div>
      <Reveal className="wrap phero__inner">
        <nav className="crumbs" aria-label="Breadcrumb" data-rv="fade">
          <Link href="/">Reflex</Link>
          <span>/</span>
          <span aria-current="page">{crumb}</span>
        </nav>
        <p className="phero__label" data-rv="fade">
          <span>{n}</span> — {label}
        </p>
        <Lines as="h1" className="display phero__title" lines={title} />
        <p className="lead phero__lead" data-rv="fade">{lead}</p>
      </Reveal>
    </header>
  );
}

export type Spec = { t: string; d: string };

export function SpecGrid({ items }: { items: Spec[] }) {
  return (
    <Reveal className="specs" stagger={0.05}>
      {items.map((s, i) => (
        <div key={s.t} className="spec" data-rv="fade">
          <span className="spec__n">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="spec__title">{s.t}</h3>
          <p className="spec__text">{s.d}</p>
        </div>
      ))}
    </Reveal>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title = "Let's build something better.", text = "Tell us about your space — we'll come back with a clear next step." }: { title?: string; text?: string }) {
  return (
    <section className="section section--dark" style={{ paddingBlock: "clamp(80px,10vw,150px)" }}>
      <div className="bp-grid" aria-hidden="true" />
      <Reveal className="wrap split split--center" >
        <Lines as="h2" className="h2" lines={[title]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "flex-start" }}>
          <p className="lead" style={{ color: "rgba(255,255,255,.7)" }} data-rv="fade">{text}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} data-rv="fade">
            <Link href="/contact/" className="btn btn--light">Start your project <span className="btn__arrow" aria-hidden="true">→</span></Link>
            <Link href="/contact/#quote" className="btn btn--ghost-light">Get a quote <span className="btn__arrow" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function SplitBlock({ eyebrow, title, children, image, alt, flip }: { eyebrow: string; title: React.ReactNode[]; children: React.ReactNode; image: string; alt: string; flip?: boolean }) {
  return (
    <section className="section">
      <Reveal className="wrap split split--center">
        <div style={{ order: flip ? 2 : 0 }}>
          <span className="eyebrow" data-rv="fade" style={{ display: "block", marginBottom: 22 }}>{eyebrow}</span>
          <Lines as="h2" className="h2" lines={title} />
          <div className="prose" data-rv="fade" style={{ marginTop: 32 }}>{children}</div>
        </div>
        <figure className="figure figure--tall" data-rv="img" style={{ margin: 0 }}>
          <img src={image} alt={alt} loading="lazy" decoding="async" width={1100} height={1400} />
        </figure>
      </Reveal>
    </section>
  );
}
