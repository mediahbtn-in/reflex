// Architectural line icons + diagrams. Single-weight strokes, currentColor.

import type { Service } from "@/lib/site";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "square" as const, strokeLinejoin: "miter" as const };

export function ServiceIcon({ name, className = "svc__icon" }: { name: Service["icon"]; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g {...S}>
        {name === "architecture" && (
          <>
            <rect x="8" y="12" width="48" height="40" />
            <path d="M8 30h22v22M30 12v10M42 30h14M42 30v22" />
            <path d="M30 22a8 8 0 0 1 8 8" strokeDasharray="2 2" />
            <path d="M4 8h8M8 4v8M52 56h8M56 52v8" />
          </>
        )}
        {name === "construction" && (
          <>
            <path d="M10 54h44" />
            <rect x="14" y="20" width="5" height="34" />
            <rect x="45" y="20" width="5" height="34" />
            <rect x="14" y="17" width="36" height="5" />
            <path d="M19 36h26M19 36l26-14M32 4v13M26 8h12" />
            <path d="M22 54v-4M42 54v-4" />
          </>
        )}
        {name === "interior" && (
          <>
            <path d="M6 54h52M10 54V40a4 4 0 0 1 4-4h36a4 4 0 0 1 4 4v14" />
            <path d="M16 36v-6h32v6M14 46h36" />
            <path d="M32 6v10M24 22l8-6 8 6z" />
            <path d="M28 22v2M36 22v2" />
          </>
        )}
        {name === "renovation" && (
          <>
            <path d="M8 54V26L32 10l24 16v28z" />
            <path d="M8 26h48" strokeDasharray="3 3" />
            <path d="M24 54V38h16v16" />
            <path d="M44 6a14 14 0 0 1 12 14M56 20l-4-3M56 20l3-4" />
          </>
        )}
        {name === "turnkey" && (
          <>
            <circle cx="20" cy="32" r="10" />
            <circle cx="20" cy="32" r="3" />
            <path d="M30 32h28M48 32v8M56 32v6" />
            <path d="M6 8h52v48H6z" strokeDasharray="2 3" />
          </>
        )}
        {name === "transformation" && (
          <>
            <rect x="6" y="14" width="22" height="36" />
            <path d="M6 32h22M17 14v18" />
            <rect x="36" y="14" width="22" height="36" />
            <path d="M36 26h12v24M48 26l10-12" />
            <path d="M29 32h6M33 29l3 3-3 3" />
          </>
        )}
      </g>
    </svg>
  );
}

/** Diagrams for the Why Reflex section. Drawn on with stroke-dashoffset. */
export function WhyDiagram({ n }: { n: number }) {
  const g = { ...S, strokeWidth: 1 };
  return (
    <svg viewBox="0 0 180 140" className="why__diagram draw" aria-hidden="true">
      <g {...g}>
        {n === 0 && (
          <>
            <circle cx="66" cy="70" r="42" style={{ ["--len" as string]: 270 }} />
            <circle cx="114" cy="70" r="42" style={{ ["--len" as string]: 270 }} />
            <path d="M90 36v68" strokeDasharray="3 3" />
            <path d="M24 128h132M24 124v8M156 124v8" />
          </>
        )}
        {n === 1 && (
          <>
            <rect x="30" y="24" width="120" height="84" />
            <path d="M30 124h120M30 120v8M150 120v8M14 24v84M10 24h8M10 108h8" />
            <circle cx="90" cy="66" r="16" />
            <path d="M90 40v52M64 66h52" />
          </>
        )}
        {n === 2 && (
          <>
            <path d="M20 40h140l-20 16H40z" />
            <path d="M40 56v28h100V56" />
            <path d="M40 84l-20 16h140l-20-16" />
            <path d="M60 64h60M60 72h60M60 76h40" strokeDasharray="2 2" />
          </>
        )}
        {n === 3 && (
          <>
            <path d="M14 70h152" />
            <circle cx="30" cy="70" r="6" />
            <circle cx="75" cy="70" r="6" />
            <circle cx="120" cy="70" r="6" />
            <circle cx="160" cy="70" r="6" />
            <path d="M30 50v-20h130v20" strokeDasharray="3 3" />
            <path d="M75 90v20M120 90v20M60 110h75" />
          </>
        )}
        {n === 4 && (
          <>
            <path d="M40 120V62l50-36 50 36v58z" />
            <path d="M40 62h100" />
            <path d="M78 120V90h24v30" />
            <circle cx="90" cy="46" r="6" />
            <path d="M14 120h152" />
          </>
        )}
      </g>
    </svg>
  );
}

/** Process step illustrations. */
export function ProcessArt({ i }: { i: number }) {
  const g = { ...S, strokeWidth: 1.2 };
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true" className="draw">
      <g {...g}>
        {i === 0 && (
          <>
            <path d="M24 106l40-62 70 10 42 48-60 22z" strokeDasharray="4 3" />
            <circle cx="98" cy="80" r="14" />
            <path d="M98 58v44M76 80h44" />
            <path d="M24 106l-6 6M176 102l6 6" />
          </>
        )}
        {i === 1 && (
          <>
            <rect x="30" y="22" width="140" height="96" />
            <path d="M30 70h60v48M90 22v24M120 70h50M120 70v48" />
            <path d="M30 12h140M30 8v8M170 8v8" />
            <path d="M90 46a24 24 0 0 1 24 24" strokeDasharray="3 3" />
          </>
        )}
        {i === 2 && (
          <>
            <path d="M100 18l64 30v52l-64 30-64-30V48z" />
            <path d="M36 48l64 30 64-30M100 78v52" />
            <path d="M68 33l64 30M132 33l-64 30" strokeDasharray="3 3" />
          </>
        )}
        {i === 3 && (
          <>
            <path d="M20 124h160" />
            <path d="M40 124V44M80 124V44M120 124V44M160 124V44" />
            <path d="M32 44h136M32 84h136" />
            <path d="M40 84l40-40M80 84l40-40M120 84l40-40" strokeDasharray="3 3" />
          </>
        )}
        {i === 4 && (
          <>
            <path d="M22 116h156" />
            <path d="M40 116V92a8 8 0 0 1 8-8h104a8 8 0 0 1 8 8v24" />
            <path d="M52 84V72h96v12" />
            <path d="M100 16v24M84 52l16-12 16 12z" />
            <path d="M60 116v8M140 116v8" />
          </>
        )}
        {i === 5 && (
          <>
            <path d="M40 120V64l60-44 60 44v56z" />
            <path d="M40 64h120M86 120V88h28v32" />
            <path d="M74 66l18 16 34-34" strokeWidth="2" />
            <path d="M16 120h168" />
          </>
        )}
      </g>
    </svg>
  );
}

/** Simplified floor plan for inner page heroes. */
export function PlanArt() {
  return (
    <svg viewBox="0 0 520 360" className="draw" aria-hidden="true">
      <g {...S} strokeWidth={1}>
        <rect x="40" y="40" width="400" height="250" strokeWidth={2} style={{ ["--len" as string]: 1400 }} />
        <rect x="115" y="65" width="375" height="200" strokeDasharray="6 5" />
        <path d="M40 165h400M140 40v250M240 40v250M340 40v250" strokeDasharray="10 4 2 4" opacity=".5" />
        <path d="M200 290v-30a30 30 0 0 1 30 30" />
        <path d="M245 290h190" strokeWidth={3} />
        <path d="M40 20h400M40 14v12M140 14v12M240 14v12M340 14v12M440 14v12" />
        <path d="M20 40v250M14 40h12M14 165h12M14 290h12" />
        <rect x="320" y="185" width="90" height="45" />
        <circle cx="365" cy="160" r="14" />
        <rect x="80" y="90" width="90" height="25" />
        <rect x="190" y="70" width="60" height="30" />
        <path d="M45 220h28M45 228h28M45 236h28M45 244h28M45 252h28M45 260h28" />
      </g>
    </svg>
  );
}
