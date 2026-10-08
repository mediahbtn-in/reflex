"use client";

import { useEffect, useRef } from "react";
import { ProcessArt } from "@/components/ui/ArchIcons";

const STEPS = [
  { t: "Discover", s: "Site + requirements", d: "We walk the site, listen to how you live or work, and define budget, brief and constraints." },
  { t: "Plan", s: "Blueprint", d: "Measured surveys become layouts, structural concepts and a clear, costed scope." },
  { t: "Design", s: "3D visualisation", d: "See every room before it exists — materials, light and joinery resolved in 3D." },
  { t: "Build", s: "Construction", d: "Engineered structure and disciplined site management, with weekly progress you can see." },
  { t: "Finish", s: "Interior", d: "Joinery, stone, lighting and fit-out executed by the same team that designed them." },
  { t: "Deliver", s: "Completed space", d: "Snag-free handover, documentation and aftercare. Your keys, your space." },
];

/** Horizontal, scroll-linked process timeline (vertical on small screens). */
export default function Process() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sec = ref.current!;
    const tr = track.current!;
    const steps = Array.from(tr.querySelectorAll<HTMLElement>(".pstep"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let cur = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const r = sec.getBoundingClientRect();
      const wide = window.innerWidth > 860;
      if (!wide) {
        steps.forEach((s) => {
          const b = s.getBoundingClientRect();
          if (b.top < window.innerHeight * 0.8) {
            s.classList.add("is-on");
            s.querySelector(".draw")?.classList.add("is-drawn");
          }
        });
        return;
      }
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      cur = reduced ? p : cur + (p - cur) * 0.12;
      const max = tr.scrollWidth - window.innerWidth + 80;
      tr.style.transform = `translate3d(${(-cur * max).toFixed(1)}px,0,0)`;
      bar.current?.style.setProperty("--pp", cur.toFixed(4));
      steps.forEach((s, i) => {
        const on = cur >= i / (steps.length - 1) - 0.12;
        s.classList.toggle("is-on", on);
        if (on) s.querySelector(".draw")?.classList.add("is-drawn");
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={ref} className="process" id="process" aria-labelledby="process-title">
      <div className="process__pin">
        <div className="wrap process__head">
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 22 }}>Our process</span>
            <h2 className="h2" id="process-title">
              From idea <strong>to keys.</strong>
            </h2>
          </div>
          <p className="lead">Six clear stages. One accountable team. No hand-offs between strangers.</p>
        </div>
        <div ref={track} className="process__track">
          {STEPS.map((s, i) => (
            <article key={s.t} className="pstep">
              <div className="pstep__top">
                <span className="pstep__n">0{i + 1}</span>
                <span className="pstep__rule" />
              </div>
              <div className="pstep__art">
                <ProcessArt i={i} />
              </div>
              <h3 className="pstep__title">{s.t}</h3>
              <p className="pstep__sub">{s.s}</p>
              <p className="pstep__text">{s.d}</p>
            </article>
          ))}
        </div>
        <div ref={bar} className="process__bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
