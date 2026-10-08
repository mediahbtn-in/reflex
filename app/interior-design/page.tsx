import { pageMeta } from "@/lib/meta";
import { CtaBand, Faq, PageHero, SpecGrid, SplitBlock } from "@/components/ui/Page";

export const metadata = pageMeta(
  "/interior-design/",
  "Interior Design",
  "Premium interior design by Reflex — space planning, materials, lighting and bespoke joinery designed and delivered by one team.",
);

export default function InteriorDesign() {
  return (
    <>
      <PageHero
        n="03"
        label="Interior Design"
        crumb="Interior Design"
        title={["Spaces", <strong key="a">designed</strong>, <strong key="b">around you.</strong>]}
        lead="Warm, considered interiors where light, material and joinery work as one — designed in 3D, then built by the same team."
      />
      <SplitBlock eyebrow="Approach" title={["Every material.", <strong key="d">Every detail.</strong>]} image="/images/proj-kitchen.webp" alt="Oak and marble kitchen designed by Reflex">
        <p>
          We begin with how you live: where morning light falls, how you cook, where you gather. Layouts follow, then
          materials — natural oak, honed stone, brushed metal — and finally lighting layered for every hour of the day.
        </p>
        <p>
          <strong>You see it before it exists.</strong> Every room is resolved in 3D visualisation, so finishes, proportions
          and joinery are agreed before a single panel is cut.
        </p>
      </SplitBlock>
      <section className="section section--warm">
        <div className="wrap">
          <div className="section__head">
            <div>
              <span className="eyebrow">What&apos;s included</span>
              <h2 className="h2">From concept <strong>to fit-out.</strong></h2>
            </div>
          </div>
          <SpecGrid
            items={[
              { t: "Space planning", d: "Layouts and furniture plans that make every square metre work." },
              { t: "Material palette", d: "Curated samples of stone, timber, metal, fabric and finishes." },
              { t: "Lighting design", d: "Ambient, task and architectural lighting with warm, dimmable scenes." },
              { t: "Bespoke joinery", d: "Kitchens, wardrobes, wall panelling and storage detailed to the millimetre." },
              { t: "3D visualisation", d: "Photo-real views of each space before execution begins." },
              { t: "Fit-out & styling", d: "Execution, furniture, art and accessories through to handover." },
            ]}
          />
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 22 }}>FAQ</span>
            <h2 className="h2">Good <strong>questions.</strong></h2>
          </div>
          <Faq
            items={[
              { q: "Do you take interior-only projects?", a: "Yes. We design and fit out apartments, villas, offices and retail spaces, with or without construction work." },
              { q: "Can we see the design before work begins?", a: "Always. Every space is presented in 3D with a material board and drawings for your approval." },
              { q: "Do you manufacture joinery?", a: "Joinery is detailed in-house and produced with trusted workshops under our supervision and quality checks." },
            ]}
          />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
