"use client";

import { useState } from "react";
import { projects } from "@/lib/site";
import { ProjectGrid } from "@/components/home/Sections";

const CATS = ["All", "Residential", "Interiors", "Commercial", "Renovation", "Turnkey"] as const;

export default function ProjectsFilter() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const list = cat === "All" ? projects : projects.filter((p) => p.category === cat);
  return (
    <>
      <div className="filters" role="group" aria-label="Filter projects">
        {CATS.map((c) => (
          <button key={c} className={`filter ${cat === c ? "is-on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <ProjectGrid key={cat} list={list.map((p) => ({ ...p, size: cat === "All" ? p.size : "std" }))} />
    </>
  );
}
