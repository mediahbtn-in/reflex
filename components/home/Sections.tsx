import Link from "next/link";
import Reveal, { Lines } from "@/components/ui/Reveal";
import { ServiceIcon, WhyDiagram } from "@/components/ui/ArchIcons";
import Logo from "@/components/ui/Logo";
import { projects, services, type Project } from "@/lib/site";

export function BrandMessage() {
  return (
    <section className="brand" id="about" aria-labelledby="brand-title">
      <div className="bp-grid" aria-hidden="true" />
      <Reveal className="wrap" stagger={0.1}>
        <Lines as="h2" className="brand__statement" lines={["Spaces that build", <strong key="b">a brighter</strong>, <strong key="c">tomorrow.</strong>]} />
        <div className="brand__row">
          <p className="brand__support" data-rv="fade">
            <span>Your vision.</span>
            <span>Our expertise.</span>
            <span>One complete journey.</span>
          </p>
          <Lines as="p" className="brand__triad" lines={["Design.", "Construct.", "Transform."]} />
        </div>
      </Reveal>
    </section>
  );
}

export function Services() {
  return (
    <section className="section" id="services" aria-labelledby="svc-title">
      <div className="wrap">
        <Reveal className="section__head">
          <div>
            <Lines as="h2" className="h2" lines={["One studio.", <strong key="s">Six disciplines.</strong>]} />
          </div>
          <p className="lead" data-rv="fade">
            Architecture, engineering and interiors under one roof — so the drawing, the build and the finished room are
            designed by the same minds.
          </p>
        </Reveal>
        <Reveal className="svc-list" stagger={0.05}>
          {services.map((s) => (
            <Link key={s.slug} href={s.href} className="svc" data-rv="fade">
              <span className="svc__n">{s.n}</span>
              <ServiceIcon name={s.icon} />
              <h3 className="svc__title">{s.title}</h3>
              <p className="svc__desc">{s.short}</p>
              <span className="svc__img">
                <img src={s.image} alt="" loading="lazy" decoding="async" width={640} height={480} />
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

const WHY = [
  { t: "One vision", d: "Design and construction working together from the very beginning." },
  { t: "Precision", d: "Detailed planning, drawings and estimates before anything is built." },
  { t: "Quality", d: "Carefully selected materials and craftsmanship you can feel." },
  { t: "Transparency", d: "A clear process, honest costs and visible progress from concept to completion." },
  { t: "Turnkey", d: "One team handling the complete journey — and one point of contact." },
];

export function WhyReflex() {
  return (
    <section className="section section--dark" id="why" aria-labelledby="why-title">
      <div className="bp-grid" aria-hidden="true" />
      <div className="wrap" style={{ position: "relative" }}>
        <Reveal className="section__head">
          <div>
            <Lines as="h2" className="h2" lines={["Engineered", <strong key="w">differently.</strong>]} />
          </div>
          <p className="lead" style={{ color: "rgba(255,255,255,.66)" }} data-rv="fade">
            Most projects are split between an architect, a contractor and an interior designer. We built Reflex so that
            never happens to you.
          </p>
        </Reveal>
        <Reveal className="why" stagger={0.06}>
          {WHY.map((w, i) => (
            <article key={w.t} className="why__item" data-rv="fade">
              <span className="why__n">0{i + 1}</span>
              <WhyDiagram n={i} />
              <h3 className="why__title">{w.t}</h3>
              <p className="why__text">{w.d}</p>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function ProjectCard({ p, i }: { p: Project; i: number }) {
  return (
    <Link href="/projects/" className={`proj proj--${p.size ?? "std"}`} data-rv="fade" aria-label={`${p.name} — ${p.category}, ${p.location}, ${p.year}`}>
      <span className="proj__media">
        <img src={p.image} alt="" loading="lazy" decoding="async" width={1600} height={1000} />
        <span className="proj__shade" />
        <span className="proj__bp" aria-hidden="true">
          <svg viewBox="0 0 400 250" preserveAspectRatio="none">
            <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
              <rect x="40" y="36" width="320" height="170" vectorEffect="non-scaling-stroke" />
              <line x1="40" y1="20" x2="360" y2="20" vectorEffect="non-scaling-stroke" />
              <line x1="20" y1="36" x2="20" y2="206" vectorEffect="non-scaling-stroke" />
              <line x1={120 + (i % 3) * 30} y1="36" x2={120 + (i % 3) * 30} y2="206" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
              <line x1="40" y1="120" x2="360" y2="120" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
              <path d="M10 10h16M10 10v16M390 240h-16M390 240v-16" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
        </span>
      </span>
      <span className="proj__info">
        <span>
          <span className="proj__cat">{p.category}</span>
          <h3 className="proj__name">{p.name}</h3>
        </span>
        <span className="proj__meta">
          <span>{p.location}</span>
          <span>{p.year}</span>
          <span className="proj__view">VIEW →</span>
        </span>
      </span>
    </Link>
  );
}

export function ProjectGrid({ list = projects }: { list?: Project[] }) {
  return (
    <Reveal className="proj-grid" stagger={0.06}>
      {list.map((p, i) => (
        <ProjectCard key={p.name} p={p} i={i} />
      ))}
    </Reveal>
  );
}

export function Projects() {
  return (
    <section className="section" id="projects" aria-labelledby="proj-title" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <Reveal className="section__head">
          <div>
            <Lines as="h2" className="h2" lines={["Visions,", <strong key="p">delivered.</strong>]} />
          </div>
          <div style={{ justifySelf: "end", display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-end" }}>
            <p className="lead" data-rv="fade" style={{ textAlign: "right" }}>
              Residential, interiors, commercial, renovation and turnkey work — each one taken from first sketch to final
              handover.
            </p>
            <Link href="/projects/" className="link-arrow" data-rv="fade">
              All projects <span>→</span>
            </Link>
          </div>
        </Reveal>
        <ProjectGrid list={projects.slice(0, 5)} />
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="final" id="contact" aria-labelledby="final-title">
      <div className="final__bg" aria-hidden="true">
        <img src="/images/final-night.webp" alt="" loading="lazy" decoding="async" width={1920} height={1080} data-parallax />
      </div>
      <Reveal className="wrap final__inner">
        <div data-rv="fade">
          <Logo />
        </div>
        <Lines as="h2" className="final__title" lines={["Let's build", <strong key="s">something better.</strong>]} />
        <p className="final__text" data-rv="fade">
          <span>Have a space in mind?</span>
          <span>Let&apos;s turn the vision into reality.</span>
        </p>
        <div className="final__ctas" data-rv="fade">
          <Link href="/contact/" className="btn btn--light">Start your project <span className="btn__arrow" aria-hidden="true">→</span></Link>
          <Link href="/contact/#quote" className="btn btn--ghost-light">Get a quote <span className="btn__arrow" aria-hidden="true">→</span></Link>
          <Link href="/contact/" className="btn btn--ghost-light">Contact Reflex <span className="btn__arrow" aria-hidden="true">→</span></Link>
        </div>
      </Reveal>
      <p className="final__tag">Building Better Tomorrows</p>
    </section>
  );
}
