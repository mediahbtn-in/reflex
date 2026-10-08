import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { services } from "@/lib/site";
import { ServiceIcon } from "@/components/ui/ArchIcons";
import Reveal from "@/components/ui/Reveal";
import { CtaBand, PageHero } from "@/components/ui/Page";

export const metadata = pageMeta(
  "/services/",
  "Services",
  "Architecture, construction, interior design, renovation, turnkey projects and space transformation — delivered by one Reflex team.",
);

const DETAIL: Record<string, string> = {
  architecture: "Site studies, concept design, planning drawings, structural coordination and detailed construction documentation.",
  construction: "Foundations, RCC structure, masonry, roofing, MEP coordination and disciplined site management through to handover.",
  "interior-design": "Space planning, material and lighting design, bespoke joinery, furniture selection and full fit-out.",
  renovation: "Structural alterations, extensions, refurbishment and upgrades — carefully phased around how you use the space.",
  turnkey: "A single contract covering design, approvals, construction, interiors and handover. You receive the keys.",
  transformation: "Re-planning layouts, opening up rooms and changing how a space works — homes, offices and retail.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        n="02"
        label="Services"
        crumb="Services"
        title={["Design.", "Construct.", <strong key="t">Transform.</strong>]}
        lead="Six disciplines, one accountable team. Engage us for a single service or for the complete journey from blueprint to finished space."
      />
      <section className="section">
        <div className="wrap">
          <Reveal className="svc-cards" stagger={0.06}>
            {services.map((s) => (
              <article key={s.slug} id={s.slug} className="svc-card" data-rv="fade">
                <div className="svc-card__media">
                  <img src={s.image} alt={`${s.title} by Reflex`} loading="lazy" decoding="async" width={960} height={720} />
                  <span className="svc-card__n">{s.n}</span>
                </div>
                <div className="svc-card__body">
                  <ServiceIcon name={s.icon} />
                  <div>
                    <h2 className="svc-card__title">{s.title}</h2>
                    <p className="svc-card__text">{DETAIL[s.slug]}</p>
                    {!s.href.includes("#") && (
                      <Link href={s.href} className="link-arrow svc-card__more">Explore <span>→</span></Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </Reveal>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
