"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BuildScene as BuildSceneT, LabelDef } from "@/lib/scene/BuildScene";
import { stages } from "@/lib/site";
import { scrollToY } from "@/components/ui/SmoothScroll";

// Copy for each stage. `r` = [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in story progress.
type StageCopy = {
  n: string;
  label: string;
  title: string[];
  copy: string[];
  r: [number, number, number, number];
  align: "left" | "right" | "center";
  tone: "ink" | "light";
};

const COPY: StageCopy[] = [
  { n: "01", label: "The Vision", title: ["Every great space", "starts with a plan."], copy: ["Design. Construct. Transform."], r: [-1, -1, 0.035, 0.07], align: "left", tone: "ink" },
  { n: "02", label: "The Foundation", title: ["The", "foundation"], copy: ["Strong foundations", "for a better tomorrow."], r: [0.14, 0.165, 0.245, 0.27], align: "left", tone: "ink" },
  { n: "03", label: "The Structure", title: ["The", "structure"], copy: ["Engineered for", "strength and longevity."], r: [0.285, 0.31, 0.375, 0.395], align: "right", tone: "ink" },
  { n: "04", label: "The Enclosure", title: ["The", "enclosure"], copy: ["Walls, windows and form", "take shape."], r: [0.41, 0.435, 0.495, 0.515], align: "left", tone: "ink" },
  { n: "05", label: "The Exterior", title: ["The", "exterior"], copy: ["A home takes", "its final form."], r: [0.53, 0.555, 0.6, 0.62], align: "right", tone: "ink" },
  { n: "06", label: "The Interior", title: ["The", "interior"], copy: ["Spaces designed", "around you."], r: [0.675, 0.7, 0.765, 0.785], align: "left", tone: "light" },
  { n: "07", label: "The Details", title: ["The", "details"], copy: ["Every material.", "Every finish.", "Every detail."], r: [0.8, 0.82, 0.865, 0.885], align: "right", tone: "light" },
  { n: "08", label: "Completed", title: ["The completed", "home"], copy: ["From vision to reality."], r: [0.925, 0.955, 2, 2], align: "center", tone: "light" },
];

// Representative frame per stage — used for reduced-motion crossfades and the progress rail.
const STAGE_FRAMES = [0.0, 0.2, 0.34, 0.46, 0.57, 0.72, 0.84, 1.0];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export default function BuildStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<LabelDef[]>([]);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const startsRef = useRef<number[]>([0, 0.12, 0.27, 0.4, 0.52, 0.64, 0.79, 0.89]);

  useEffect(() => {
    const section = sectionRef.current!;
    const canvas = canvasRef.current!;
    const stageEl = stageRef.current!;
    let scene: BuildSceneT | null = null;
    let raf = 0;
    let disposed = false;
    let inView = true;
    let smoothP = 0;
    let lastActive = -1;
    let lastTone = "";
    let introStart = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let reducedStage = -1;
    let reducedP = 0;

    const w = window.innerWidth;
    const quality = w < 768 ? "low" : w < 1280 || (navigator.hardwareConcurrency ?? 8) <= 4 ? "medium" : "high";
    const maxDpr = quality === "high" ? 1.75 : quality === "medium" ? 1.5 : 1.5;

    const progress = () => {
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      return clamp01(-r.top / total);
    };

    const sizeNow = () => {
      if (!scene) return;
      const rect = stageEl.getBoundingClientRect();
      scene.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, maxDpr));
    };

    const labelPos = { x: 0, y: 0, vis: false };
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!scene || !inView) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = progress();

      let p: number;
      if (reduced) {
        let idx = 0;
        startsRef.current.forEach((s, i) => target >= s - 0.001 && (idx = i));
        if (idx !== reducedStage) {
          reducedStage = idx;
          canvas.style.opacity = "0";
          window.setTimeout(() => {
            reducedP = STAGE_FRAMES[idx];
            canvas.style.opacity = "1";
          }, 260);
        }
        p = reducedP;
      } else {
        // Critically-damped follow: cinematic inertia on top of Lenis.
        const k = 1 - Math.exp(-dt * 5.5);
        smoothP += (target - smoothP) * k;
        if (Math.abs(target - smoothP) < 0.00005) smoothP = target;
        p = smoothP;
      }

      const intro = reduced ? 1 : clamp01((now - introStart) / 2600);
      const t = now / 1000;
      scene.update(p, t, intro);
      scene.render();

      // Copy blocks
      COPY.forEach((c, i) => {
        const el = copyRefs.current[i];
        if (!el) return;
        const a = c.r[0] < 0 ? 1 : seg(p, c.r[0], c.r[1]);
        const b = seg(p, c.r[2], c.r[3]);
        const o = a * (1 - b);
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
        el.style.transform = reduced ? "none" : `translate3d(0, ${(1 - a) * 34 - b * 34}px, 0)`;
        el.classList.toggle("is-live", o > 0.5);
      });

      // Technical labels
      const list = labelDefs;
      for (let i = 0; i < list.length; i++) {
        const el = labelRefs.current[i];
        if (!el) continue;
        const L = list[i];
        const o = seg(p, L.range[0], L.range[1]) * (1 - seg(p, L.range[2], L.range[3]));
        if (o < 0.01) {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          continue;
        }
        scene.project(L.pos, labelPos);
        el.style.visibility = labelPos.vis ? "visible" : "hidden";
        el.style.opacity = String(o);
        el.style.transform = `translate3d(${labelPos.x.toFixed(1)}px, ${labelPos.y.toFixed(1)}px, 0)`;
      }

      // Progress rail + mobile bar
      let idx = 0;
      startsRef.current.forEach((s, i) => p >= s - 0.001 && (idx = i));
      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
      }
      railRef.current?.style.setProperty("--p", p.toFixed(4));
      barRef.current?.style.setProperty("--p", p.toFixed(4));
      if (scrimRef.current) scrimRef.current.style.opacity = String(seg(p, 0.62, 0.68) * (1 - seg(p, 0.97, 1) * 0.3));
      if (cueRef.current) cueRef.current.style.opacity = String(1 - seg(p, 0.0, 0.03));

      const tone = p > 0.625 && progress() < 1.0001 ? "light" : "ink";
      if (tone !== lastTone) {
        lastTone = tone;
        section.dataset.tone = tone;
      }
      const r = section.getBoundingClientRect();
      const navDark = r.top <= 10 && r.bottom > 80 && tone === "light";
      document.documentElement.dataset.navTheme = navDark ? "light" : "ink";
    };

    let labelDefs: LabelDef[] = [];

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        if (!inView) document.documentElement.dataset.navTheme = "ink";
      },
      { rootMargin: "100px" },
    );
    io.observe(section);

    const ro = new ResizeObserver(sizeNow);
    ro.observe(stageEl);

    (async () => {
      try {
        const test = document.createElement("canvas");
        if (!test.getContext("webgl2") && !test.getContext("webgl")) throw new Error("no webgl");
        await document.fonts?.ready;
        const mod = await import("@/lib/scene/BuildScene");
        if (disposed) return;
        const cs = getComputedStyle(document.documentElement);
        const mono = cs.getPropertyValue("--font-mono").trim() || "monospace";
        const sans = cs.getPropertyValue("--font-sans").trim() || "sans-serif";
        scene = new mod.BuildScene(canvas, { quality, fontMono: mono, fontSans: sans });
        labelDefs = mod.LABELS;
        if (process.env.NODE_ENV !== "production") (window as unknown as { __scene: unknown }).__scene = scene;
        startsRef.current = mod.STAGE_STARTS;
        setLabels(mod.LABELS);
        smoothP = progress();
        sizeNow();
        introStart = performance.now();
        last = introStart;
        setReady(true);
        raf = requestAnimationFrame(frame);
      } catch (err) {
        console.warn("[reflex] 3D story unavailable, using static fallback", err);
        setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      scene?.dispose();
      delete document.documentElement.dataset.navTheme;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback (no WebGL): still a scroll story — copy blocks crossfade over a blueprint background.
  useEffect(() => {
    if (!failed) return;
    const section = sectionRef.current!;
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      const p = clamp01(-r.top / (r.height - window.innerHeight));
      COPY.forEach((c, i) => {
        const el = copyRefs.current[i];
        if (!el) return;
        const a = c.r[0] < 0 ? 1 : seg(p, c.r[0], c.r[1]);
        const o = a * (1 - seg(p, c.r[2], c.r[3]));
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [failed]);

  const goTo = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const total = section.offsetHeight - window.innerHeight;
    const p = i === 0 ? 0 : STAGE_FRAMES[i];
    scrollToY(top + total * p);
  };

  return (
    <section ref={sectionRef} className={`story ${ready ? "is-ready" : ""} ${failed ? "is-fallback" : ""}`} data-tone="ink" aria-label="Watch your space come to life">
      <div ref={stageRef} className="story__stage">
        <div className="story__paper" aria-hidden="true" />
        <canvas ref={canvasRef} className="story__canvas" aria-hidden="true" />
        <div ref={scrimRef} className="story__scrim" aria-hidden="true" />

        <div className="story__labels" aria-hidden="true">
          {labels.map((l, i) => (
            <div key={l.id} ref={(el) => { labelRefs.current[i] = el; }} className="tlabel">
              <span className="tlabel__dot" />
              <span className="tlabel__line" />
              <span className="tlabel__box">
                <span className="tlabel__title">{l.title}</span>
                {l.sub && <span className="tlabel__sub">{l.sub}</span>}
              </span>
            </div>
          ))}
        </div>

        <div className="story__copy">
          {COPY.map((c, i) => (
            <div
              key={c.n}
              ref={(el) => { copyRefs.current[i] = el; }}
              className={`scopy scopy--${c.align} scopy--${c.tone} ${i === 0 ? "scopy--hero" : ""}`}
              style={i === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
            >
              <p className="scopy__label"><span>{c.n}</span> — {c.label}</p>
              {i === 0 ? (
                <>
                  <h1 className="scopy__seo">Interior &amp; Construction — Built Around Your Vision</h1>
                  <p className="scopy__title scopy__title--hero" role="heading" aria-level={2}>
                    {c.title.map((t) => <span key={t}>{t}</span>)}
                  </p>
                </>
              ) : (
                <h2 className="scopy__title">{c.title.map((t) => <span key={t}>{t}</span>)}</h2>
              )}
              <p className="scopy__text">{c.copy.map((t) => <span key={t}>{t}</span>)}</p>
              {i === 7 && (
                <div className="scopy__ctas">
                  <Link href="/projects/" className="btn btn--light">View our projects <span className="btn__arrow" aria-hidden="true">→</span></Link>
                  <Link href="/contact/" className="btn btn--ghost-light">Get a quote <span className="btn__arrow" aria-hidden="true">→</span></Link>
                </div>
              )}
            </div>
          ))}
        </div>

        <div ref={cueRef} className="story__cue" aria-hidden="true">
          <span className="story__cue-line" />
          Scroll to build
        </div>

        <div ref={railRef} className="rail" aria-label="Story progress">
          <span className="rail__track" aria-hidden="true"><span className="rail__fill" /></span>
          {stages.map((s, i) => (
            <button key={s.n} className={`rail__item ${active === i ? "is-active" : ""} ${active > i ? "is-done" : ""}`} onClick={() => goTo(i)} aria-label={`${s.n} — ${s.title}`} aria-current={active === i ? "step" : undefined}>
              <span className="rail__n">{s.n}</span>
              <span className="rail__dot" />
              <span className="rail__name">{s.title}</span>
            </button>
          ))}
        </div>

        <div ref={barRef} className="mbar" aria-hidden="true">
          <span className="mbar__n">{stages[active].n}</span>
          <span className="mbar__name">{stages[active].title}</span>
          <span className="mbar__track"><span className="mbar__fill" /></span>
          <span className="mbar__n mbar__n--end">08</span>
        </div>
      </div>
    </section>
  );
}
