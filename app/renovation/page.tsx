import { pageMeta } from "@/lib/meta";
import { CtaBand, PageHero, SpecGrid, SplitBlock } from "@/components/ui/Page";
import BeforeAfter from "@/components/home/BeforeAfter";

export const metadata = pageMeta(
  "/renovation/",
  "Renovation",
  "Renovation and space transformation by Reflex — structural alterations, extensions and complete refurbishments, carefully planned and delivered.",
);

export default function Renovation() {
  return (
    <>
      <PageHero
        crumb="Renovation"
        title={["Respect what", "exists.", <strong key="b">Unlock what could be.</strong>]}
        lead="We survey, re-plan and rebuild existing homes and workplaces — opening up rooms, adding light and upgrading every system behind the walls."
      />
      <SplitBlock eyebrow="Approach" title={["Careful by", <strong key="d">design.</strong>]} image="/images/svc-renovation.webp" alt="Building enclosure during renovation" flip>
        <p>
          Renovation starts with understanding: a measured survey, a structural assessment and an honest view of what to
          keep. From there we plan the work in phases that suit how you use the space.
        </p>
        <p><strong>One team means fewer surprises.</strong> The designers who re-plan your space stay on site while it is rebuilt.</p>
      </SplitBlock>
      <section className="section section--warm">
        <div className="wrap">
          <div className="section__head">
            <div>
              <span className="eyebrow">Transformation</span>
              <h2 className="h2">Concept <strong>to completion.</strong></h2>
            </div>
            <p className="lead">Drag across the image to move from blueprint to finished interior.</p>
          </div>
          <BeforeAfter />
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <SpecGrid
            items={[
              { t: "Survey & assessment", d: "Measured drawings, structural checks and a clear scope of work." },
              { t: "Re-planning", d: "New layouts, openings and extensions designed in 3D." },
              { t: "Structural alterations", d: "Beams, columns and supports engineered and installed safely." },
              { t: "Services upgrade", d: "Electrical, plumbing, insulation and HVAC brought up to date." },
              { t: "Interior refurbishment", d: "Flooring, joinery, lighting and finishes renewed." },
              { t: "Phased delivery", d: "Work planned around occupied homes and operating businesses." },
            ]}
          />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
