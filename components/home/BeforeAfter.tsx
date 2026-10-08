"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FRAMES = [
  { key: "Blueprint", src: "/images/ba-1-blueprint.webp" },
  { key: "3D Design", src: "/images/ba-2-design.webp" },
  { key: "Construction", src: "/images/ba-3-construction.webp" },
  { key: "Final Interior", src: "/images/ba-4-final.webp" },
];

/**
 * Drag (or use arrow keys / step buttons) to wipe through the four states of the
 * same space. Value v ∈ [0, 3]: integer part = current frame, fraction = wipe.
 */
export default function BeforeAfter() {
  const [v, setV] = useState(0.5);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const target = useRef(0.5);
  const anim = useRef(0);

  const animateTo = useCallback((to: number) => {
    target.current = to;
    cancelAnimationFrame(anim.current);
    const step = () => {
      setV((cur) => {
        const n = cur + (target.current - cur) * 0.14;
        if (Math.abs(n - target.current) < 0.002) return target.current;
        anim.current = requestAnimationFrame(step);
        return n;
      });
    };
    anim.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const fromPointer = (clientX: number) => {
    const r = frame.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return x * 3;
  };

  const idx = Math.min(2, Math.floor(v));
  const frac = v - idx;
  const active = Math.round(v);

  return (
    <div className="ba">
      <div
        ref={frame}
        className="ba__frame"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          animateTo(fromPointer(e.clientX));
        }}
        onPointerMove={(e) => dragging.current && (cancelAnimationFrame(anim.current), setV(fromPointer(e.clientX)))}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {FRAMES.map((f, i) => {
          // Frame i+1 is revealed left→right over frame i as the wipe passes.
          let clip = "inset(0 100% 0 0)";
          if (i <= idx) clip = "inset(0 0 0 0)";
          if (i === idx + 1) clip = `inset(0 ${(100 - frac * 100).toFixed(2)}% 0 0)`;
          return <img key={f.key} className="ba__img" src={f.src} alt={`${f.key} stage of the same Reflex space`} loading="lazy" decoding="async" style={{ clipPath: clip }} width={1600} height={900} />;
        })}
        <span className="ba__scan" style={{ left: `${(frac * 100).toFixed(2)}%`, opacity: frac > 0.002 && frac < 0.998 ? 1 : 0 }} />
        <span className="ba__handle" style={{ left: `${((v / 3) * 100).toFixed(2)}%` }} aria-hidden="true">⟷</span>
        <span className="ba__tag">{FRAMES[active].key}</span>
        <input
          className="ba__range"
          type="range"
          min={0}
          max={3}
          step={0.01}
          value={v}
          aria-label="Transformation stage"
          aria-valuetext={FRAMES[active].key}
          onChange={(e) => setV(parseFloat(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              animateTo(Math.min(3, Math.round(v) + 1));
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              animateTo(Math.max(0, Math.round(v) - 1));
            }
          }}
          tabIndex={0}
          style={{ pointerEvents: "none" }}
        />
      </div>
      <div className="ba__steps" role="tablist" aria-label="Stages">
        {FRAMES.map((f, i) => (
          <button key={f.key} role="tab" aria-selected={active === i} className={`ba__step ${active === i ? "is-on" : ""}`} onClick={() => animateTo(i)}>
            <span>0{i + 1}</span>
            {f.key}
          </button>
        ))}
      </div>
    </div>
  );
}
