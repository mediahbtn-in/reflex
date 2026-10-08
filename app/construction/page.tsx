import { pageMeta } from "@/lib/meta";
import { CtaBand, Faq, PageHero, SpecGrid, SplitBlock } from "@/components/ui/Page";

export const metadata = pageMeta(
  "/construction/",
  "Construction",
  "Professionally executed construction by Reflex — engineered foundations, RCC structures and disciplined site management from groundwork to handover.",
);

export default function Construction() {
  return (
    <>
      <PageHero
        n="04"
        label="Construction"
        crumb="Construction"
        title={["Engineered", <strong key="a">for strength</strong>, <strong key="b">and longevity.</strong>]}
        lead="From the first footing to the final finish, our construction teams build exactly what was designed — precisely, safely and on schedule."
      />
      <SplitBlock eyebrow="On site" title={["Strong foundations,", <strong key="d">better tomorrows.</strong>]} image="/images/svc-construction.webp" alt="Concrete structure under construction">
        <p>
          Every Reflex build starts with a coordinated set of architectural and structural drawings, a detailed bill of
          quantities and a programme you can follow week by week.
        </p>
        <p>
          <strong>Quality is checked, not assumed.</strong> Reinforcement, concrete, levels and finishes are inspected at
          each stage, and documented for you.
        </p>
      </SplitBlock>
      <section className="section section--warm">
        <div className="wrap">
          <div className="section__head">
            <div>
              <span className="eyebrow">Scope</span>
              <h2 className="h2">Built <strong>stage by stage.</strong></h2>
            </div>
          </div>
          <SpecGrid
            items={[
              { t: "Groundwork", d: "Surveys, excavation, footings, foundation walls and slabs." },
              { t: "Structure", d: "RCC columns, beams and slabs, including cantilevers and long spans." },
              { t: "Enclosure", d: "Masonry, glazing, doors, waterproofing and roofing." },
              { t: "Services", d: "Electrical, plumbing, HVAC and drainage coordinated in one model." },
              { t: "Exterior works", d: "Cladding, landscaping, paving, pools and exterior lighting." },
              { t: "Handover", d: "Snagging, documentation, warranties and aftercare." },
            ]}
          />
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 22 }}>FAQ</span>
            <h2 className="h2">Before you <strong>break ground.</strong></h2>
          </div>
          <Faq
            items={[
              { q: "Can you work from my architect's drawings?", a: "Yes. We can build from your existing design, or coordinate and complete the drawings with our own architects." },
              { q: "How do you keep projects on budget?", a: "Through detailed quantities before work starts, agreed change procedures, and transparent progress reporting." },
              { q: "Do you handle approvals?", a: "On turnkey projects we manage the drawings and submissions needed for approvals with the relevant authorities." },
            ]}
          />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
