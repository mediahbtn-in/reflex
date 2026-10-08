import { pageMeta } from "@/lib/meta";
import { CtaBand, PageHero, SpecGrid, SplitBlock } from "@/components/ui/Page";

export const metadata = pageMeta(
  "/about/",
  "About Reflex",
  "Reflex Interior and Construction is one studio for architecture, construction and interior design — taking every project from first sketch to finished space.",
);

export default function About() {
  return (
    <>
      <PageHero
        n="01"
        label="About"
        crumb="About"
        title={["One team.", <strong key="a">One complete</strong>, <strong key="b">journey.</strong>]}
        lead="Reflex brings architects, engineers, site teams and interior designers together under one roof — so the person who draws your space is working beside the people who build and finish it."
      />
      <SplitBlock eyebrow="Our story" title={["Built around", <strong key="v">your vision.</strong>]} image="/images/proj-cantilever.webp" alt="Cantilevered Reflex home at dusk">
        <p>
          Too many projects lose something between the drawing and the finished room. Design intent gets value-engineered
          away, contractors work from incomplete details, and interiors are bolted on at the end.
        </p>
        <p>
          <strong>Reflex was founded to close that gap.</strong> We plan structure, services and interiors together from
          day one, so every decision — from footing size to the oak on a cabinet door — supports the same idea.
        </p>
        <p>The result is a calmer process, fewer surprises, and spaces that feel resolved down to the last detail.</p>
      </SplitBlock>
      <section className="section section--warm">
        <div className="wrap">
          <div className="section__head">
            <div>
              <span className="eyebrow">What we believe</span>
              <h2 className="h2">Principles <strong>we build by.</strong></h2>
            </div>
          </div>
          <SpecGrid
            items={[
              { t: "Plan before we pour", d: "Detailed drawings, structure and costs are agreed before work starts on site." },
              { t: "Design and build together", d: "Designers stay on the project through construction, not just until approval." },
              { t: "Honest materials", d: "Stone, timber, concrete and glass chosen for how they age, not just how they photograph." },
              { t: "Visible progress", d: "Regular site updates and a single point of contact who always knows the answer." },
              { t: "Craft at every scale", d: "From the foundation layout to the reveal on a skirting board." },
              { t: "Spaces for people", d: "Light, proportion and comfort come first. Everything else follows." },
            ]}
          />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
