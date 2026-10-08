import BuildStory from "@/components/home/BuildStory";
import BeforeAfter from "@/components/home/BeforeAfter";
import Process from "@/components/home/Process";
import { BrandMessage, FinalCTA, Projects, Services, WhyReflex } from "@/components/home/Sections";
import Reveal, { Lines } from "@/components/ui/Reveal";
import Parallax from "@/components/ui/Parallax";

export default function Home() {
  return (
    <>
      {/* 01–08: the building is the main character */}
      <BuildStory />
      <BrandMessage />
      <Services />
      <WhyReflex />
      <Process />
      <Projects />
      <section className="section section--warm" id="transformation" aria-labelledby="ba-title">
        <div className="wrap">
          <Reveal className="section__head">
            <div>
              <Lines as="h2" className="h2" lines={["Concept to", <strong key="c">completion.</strong>]} />
            </div>
            <p className="lead" data-rv="fade">
              The same space, four moments in its life. Drag across the image to move from the first line on paper to the
              finished interior.
            </p>
          </Reveal>
          <BeforeAfter />
        </div>
      </section>
      <FinalCTA />
      <Parallax />
    </>
  );
}
