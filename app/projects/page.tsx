import { pageMeta } from "@/lib/meta";
import { CtaBand, PageHero } from "@/components/ui/Page";
import ProjectsFilter from "./ProjectsFilter";

export const metadata = pageMeta(
  "/projects/",
  "Projects",
  "Selected Reflex projects — residential, interiors, commercial, renovation and turnkey work, each taken from first sketch to final handover.",
);

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        n="06"
        label="Projects"
        crumb="Projects"
        title={["Selected", <strong key="p">projects.</strong>]}
        lead="Residential, interiors, commercial, renovation and turnkey — every project taken from vision to reality by one team."
      />
      <section className="section">
        <div className="wrap">
          <ProjectsFilter />
        </div>
      </section>
      <CtaBand title="Your project could be next." />
    </>
  );
}
