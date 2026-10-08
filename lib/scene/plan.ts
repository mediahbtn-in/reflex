import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the house. The blueprint sheet, the 3D design
// wireframe and the physical building are all generated from this data, so the
// drawing and the construction line up exactly.
// Units: metres. Front façade faces +Z. Ground level y = 0.
// ─────────────────────────────────────────────────────────────────────────────

export const FFL = 0.25; // finished floor level (top of ground slab)
export const GF_TOP = 3.25; // underside of first-floor slab
export const L1 = 3.5; // first-floor level
export const UF_TOP = 6.5; // underside of roof slab
export const ROOF_TOP = 6.72;
export const WALL_T = 0.3;

export type Opening = {
  a: number;
  b: number;
  sill: number; // relative to floor
  head: number; // relative to floor
  kind: "door" | "window" | "glazing";
};

export type WallDef = {
  id: string;
  axis: "x" | "z"; // the axis the wall runs along
  at: number; // fixed coordinate on the other axis
  from: number;
  to: number;
  floor: 0 | 1;
  openings: Opening[];
  side: "front" | "back" | "left" | "right";
};

export const GF = { x0: -8, x1: 8, z0: -5, z1: 5 };
export const UF = { x0: -5, x1: 10, z0: -4, z1: 4 };
export const DOOR = { x0: -3.5, x1: -2.3, z: 5, head: 2.45 };

export const WALLS: WallDef[] = [
  // ── Ground floor ──
  {
    id: "gf-front", axis: "x", at: 5, from: -8, to: 8, floor: 0, side: "front",
    openings: [
      { a: DOOR.x0, b: DOOR.x1, sill: 0, head: DOOR.head, kind: "door" },
      { a: 0.2, b: 7.8, sill: 0, head: 2.68, kind: "glazing" },
    ],
  },
  {
    id: "gf-right", axis: "z", at: 8, from: -5, to: 5, floor: 0, side: "right",
    openings: [{ a: -3.6, b: 4.6, sill: 0, head: 2.68, kind: "glazing" }],
  },
  {
    id: "gf-back", axis: "x", at: -5, from: -8, to: 8, floor: 0, side: "back",
    openings: [{ a: 0.8, b: 3.4, sill: 0.8, head: 2.4, kind: "window" }],
  },
  {
    id: "gf-left", axis: "z", at: -8, from: -5, to: 5, floor: 0, side: "left",
    openings: [
      { a: 0.2, b: 1.0, sill: 0.3, head: 2.6, kind: "window" },
      { a: 2.0, b: 2.8, sill: 0.3, head: 2.6, kind: "window" },
    ],
  },
  // ── Upper floor (cantilevers 2 m past the ground floor on the right) ──
  {
    id: "uf-front", axis: "x", at: 4, from: -5, to: 10, floor: 1, side: "front",
    openings: [{ a: -3, b: 8.6, sill: 0.9, head: 2.3, kind: "window" }],
  },
  {
    id: "uf-right", axis: "z", at: 10, from: -4, to: 4, floor: 1, side: "right",
    openings: [{ a: -2, b: 2, sill: 0.2, head: 2.7, kind: "window" }],
  },
  {
    id: "uf-back", axis: "x", at: -4, from: -5, to: 10, floor: 1, side: "back",
    openings: [{ a: 0, b: 7, sill: 0.9, head: 2.3, kind: "window" }],
  },
  {
    id: "uf-left", axis: "z", at: -5, from: -4, to: 4, floor: 1, side: "left",
    openings: [{ a: -1.5, b: 1.5, sill: 0, head: 2.5, kind: "glazing" }],
  },
];

export const GRID_X = [-8, -4, 0, 4, 8];
export const GRID_Z = [-5, 0, 5];
export const UF_GRID_X = [-5, 0, 5, 10];
export const UF_GRID_Z = [-3.4, 3.4];

export type Piece = {
  min: THREE.Vector3;
  max: THREE.Vector3;
  wall: WallDef;
  along0: number;
  along1: number;
};

/** Split a wall into solid boxes around its openings. */
export function wallPieces(w: WallDef): Piece[] {
  const y0 = w.floor === 0 ? FFL : L1;
  const h = w.floor === 0 ? GF_TOP - FFL : UF_TOP - L1;
  const t = WALL_T;
  const out: Piece[] = [];
  const push = (a: number, b: number, ya: number, yb: number) => {
    if (b - a < 0.01 || yb - ya < 0.01) return;
    const min = new THREE.Vector3();
    const max = new THREE.Vector3();
    if (w.axis === "x") {
      min.set(a, ya, w.at - t / 2);
      max.set(b, yb, w.at + t / 2);
    } else {
      min.set(w.at - t / 2, ya, a);
      max.set(w.at + t / 2, yb, b);
    }
    out.push({ min, max, wall: w, along0: a, along1: b });
  };
  let cur = w.from - t / 2;
  const ops = [...w.openings].sort((p, q) => p.a - q.a);
  for (const o of ops) {
    push(cur, o.a, y0, y0 + h);
    if (o.sill > 0) push(o.a, o.b, y0, y0 + o.sill);
    if (o.head < h) push(o.a, o.b, y0 + o.head, y0 + h);
    cur = o.b;
  }
  push(cur, w.to + t / 2, y0, y0 + h);
  return out;
}

export function openingBox(w: WallDef, o: Opening) {
  const y0 = w.floor === 0 ? FFL : L1;
  const min = new THREE.Vector3();
  const max = new THREE.Vector3();
  if (w.axis === "x") {
    min.set(o.a, y0 + o.sill, w.at - WALL_T / 2);
    max.set(o.b, y0 + o.head, w.at + WALL_T / 2);
  } else {
    min.set(w.at - WALL_T / 2, y0 + o.sill, o.a);
    max.set(w.at + WALL_T / 2, y0 + o.head, o.b);
  }
  return { min, max };
}

// ─────────────────────────────────────────────────────────────────────────────
// Blueprint sheet: a transparent canvas drawn in world space and laid on the
// paper. Contains hatching, dimensions, grid bubbles, annotations and a title
// block — everything that makes a plan read as a real architectural drawing.
// ─────────────────────────────────────────────────────────────────────────────

export const SHEET = { x0: -21, x1: 25, z0: -15, z1: 15 }; // world extents

export function makePlanTexture(fontMono: string, fontSans: string, px = 3072) {
  const W = SHEET.x1 - SHEET.x0;
  const D = SHEET.z1 - SHEET.z0;
  const s = px / W; // px per metre
  const c = document.createElement("canvas");
  c.width = px;
  c.height = Math.round(D * s);
  const g = c.getContext("2d")!;
  const X = (x: number) => (x - SHEET.x0) * s;
  const Z = (z: number) => (z - SHEET.z0) * s;
  const ink = "rgba(23,79,130,";
  const font = (size: number, weight = 500, fam = fontMono) => `${weight} ${size * s}px ${fam}`;

  g.lineCap = "square";

  // Sheet border + inner frame
  g.strokeStyle = ink + "0.55)";
  g.lineWidth = 2;
  g.strokeRect(X(-19.6), Z(-13.6), (19.6 + 23.6) * s, 27.2 * s);
  g.lineWidth = 1;
  g.strokeRect(X(-19.3), Z(-13.3), (19.3 + 23.3) * s, 26.6 * s);

  // Column grid axes (dash-dot) with bubbles
  g.setLineDash([0.6 * s, 0.2 * s, 0.08 * s, 0.2 * s]);
  g.strokeStyle = ink + "0.35)";
  g.lineWidth = 1;
  for (const x of [-8, -4, 0, 4, 8, 10]) {
    g.beginPath();
    g.moveTo(X(x), Z(-9.6));
    g.lineTo(X(x), Z(8.4));
    g.stroke();
  }
  for (const z of [-5, 0, 5]) {
    g.beginPath();
    g.moveTo(X(-12.2), Z(z));
    g.lineTo(X(12.6), Z(z));
    g.stroke();
  }
  g.setLineDash([]);
  const bubble = (x: number, z: number, t: string) => {
    g.beginPath();
    g.arc(X(x), Z(z), 0.55 * s, 0, Math.PI * 2);
    g.fillStyle = "rgba(244,247,250,0.9)";
    g.fill();
    g.strokeStyle = ink + "0.8)";
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = ink + "0.95)";
    g.font = font(0.55, 600);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(t, X(x), Z(z) + 1);
  };
  [-8, -4, 0, 4, 8, 10].forEach((x, i) => bubble(x, -10.2, String(i + 1)));
  ["A", "B", "C"].forEach((t, i) => bubble(-12.8, [-5, 0, 5][i], t));

  // Upper-floor outline (dashed, above cut plane)
  g.setLineDash([0.35 * s, 0.22 * s]);
  g.strokeStyle = ink + "0.55)";
  g.lineWidth = 1.4;
  g.strokeRect(X(UF.x0), Z(UF.z0), (UF.x1 - UF.x0) * s, (UF.z1 - UF.z0) * s);
  g.setLineDash([]);

  // Walls: hatched solid pieces (ground floor only — the cut plane)
  const hatch = document.createElement("canvas");
  hatch.width = hatch.height = 16;
  const hg = hatch.getContext("2d")!;
  hg.strokeStyle = ink + "0.55)";
  hg.lineWidth = 1;
  hg.beginPath();
  hg.moveTo(0, 16);
  hg.lineTo(16, 0);
  hg.stroke();
  const pat = g.createPattern(hatch, "repeat")!;
  for (const w of WALLS.filter((w) => w.floor === 0)) {
    for (const p of wallPieces(w)) {
      if (p.min.y > FFL + 0.01) continue; // only full-height / sill pieces cut by plan
      const fullHeight = p.max.y - p.min.y > 2.5;
      const x = X(p.min.x);
      const z = Z(p.min.z);
      const ww = (p.max.x - p.min.x) * s;
      const dd = (p.max.z - p.min.z) * s;
      if (fullHeight) {
        g.fillStyle = ink + "0.10)";
        g.fillRect(x, z, ww, dd);
        g.fillStyle = pat;
        g.fillRect(x, z, ww, dd);
      }
    }
    // windows / glazing: triple line
    for (const o of w.openings) {
      if (o.kind === "door") continue;
      g.strokeStyle = ink + "0.85)";
      g.lineWidth = 1;
      for (const off of [-0.1, 0, 0.1]) {
        g.beginPath();
        if (w.axis === "x") {
          g.moveTo(X(o.a), Z(w.at + off));
          g.lineTo(X(o.b), Z(w.at + off));
        } else {
          g.moveTo(X(w.at + off), Z(o.a));
          g.lineTo(X(w.at + off), Z(o.b));
        }
        g.stroke();
      }
    }
  }
  // Columns (solid)
  g.fillStyle = ink + "0.9)";
  for (const x of [-8, -4, 0, 4, 8]) for (const z of [-5, 0, 5]) g.fillRect(X(x - 0.175), Z(z - 0.175), 0.35 * s, 0.35 * s);

  // Entrance door swing
  g.strokeStyle = ink + "0.8)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(X(DOOR.x0), Z(5));
  g.lineTo(X(DOOR.x0), Z(5 - 1.2));
  g.stroke();
  g.setLineDash([0.15 * s, 0.1 * s]);
  g.beginPath();
  g.arc(X(DOOR.x0), Z(5), 1.2 * s, -Math.PI / 2, 0);
  g.stroke();
  g.setLineDash([]);

  // Furniture & fixtures (fine line)
  g.strokeStyle = ink + "0.45)";
  g.lineWidth = 1;
  const rect = (x0: number, z0: number, x1: number, z1: number) => g.strokeRect(X(x0), Z(z0), (x1 - x0) * s, (z1 - z0) * s);
  rect(3.3, 0.9, 7.0, 2.2); // sofa
  rect(6.0, -0.6, 7.0, 0.9);
  rect(3.2, -0.6, 7.2, 3.2); // rug
  g.beginPath();
  g.arc(X(4.8), Z(0.2), 0.55 * s, 0, Math.PI * 2);
  g.stroke();
  rect(-5.6, -2.3, -1.9, -1.0); // island
  rect(-7.6, -4.85, -1.4, -4.25); // kitchen run
  rect(0.9, -3.7, 3.3, -2.5); // dining
  for (let i = 0; i < 3; i++) {
    rect(1.0 + i * 0.8, -4.25, 1.5 + i * 0.8, -3.85);
    rect(1.0 + i * 0.8, -2.35, 1.5 + i * 0.8, -1.95);
  }
  // stair treads
  for (let i = 0; i < 16; i++) {
    const z = 3.6 - i * 0.28;
    g.beginPath();
    g.moveTo(X(-7.85), Z(z));
    g.lineTo(X(-6.75), Z(z));
    g.stroke();
  }
  g.beginPath();
  g.moveTo(X(-7.3), Z(3.4));
  g.lineTo(X(-7.3), Z(-0.6));
  g.lineTo(X(-7.45), Z(-0.3));
  g.moveTo(X(-7.3), Z(-0.6));
  g.lineTo(X(-7.15), Z(-0.3));
  g.stroke();

  // Pool + deck (dashed — external works)
  g.setLineDash([0.3 * s, 0.18 * s]);
  rect(1.5, 8, 11, 11.5);
  rect(0.8, 7.3, 11.7, 12.2);
  rect(-8.6, 5.6, -0.5, 9.5);
  g.setLineDash([]);

  // Dimension chains
  const dim = (x0: number, z0: number, x1: number, z1: number, label: string, offset = 0.45) => {
    const horiz = Math.abs(z1 - z0) < 1e-6;
    g.strokeStyle = ink + "0.85)";
    g.fillStyle = ink + "0.95)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(X(x0), Z(z0));
    g.lineTo(X(x1), Z(z1));
    g.stroke();
    const tick = (x: number, z: number) => {
      g.beginPath();
      g.moveTo(X(x) - 0.18 * s, Z(z) + 0.18 * s);
      g.lineTo(X(x) + 0.18 * s, Z(z) - 0.18 * s);
      g.stroke();
      g.beginPath();
      if (horiz) {
        g.moveTo(X(x), Z(z) - 0.35 * s);
        g.lineTo(X(x), Z(z) + 0.35 * s);
      } else {
        g.moveTo(X(x) - 0.35 * s, Z(z));
        g.lineTo(X(x) + 0.35 * s, Z(z));
      }
      g.stroke();
    };
    tick(x0, z0);
    tick(x1, z1);
    g.font = font(0.42, 500);
    g.textAlign = "center";
    g.textBaseline = "bottom";
    if (horiz) g.fillText(label, X((x0 + x1) / 2), Z(z0) - offset * s * 0.4);
    else {
      g.save();
      g.translate(X(x0) - offset * s * 0.4, Z((z0 + z1) / 2));
      g.rotate(-Math.PI / 2);
      g.fillText(label, 0, 0);
      g.restore();
    }
  };
  for (let i = 0; i < 4; i++) dim(-8 + i * 4, -7.4, -4 + i * 4, -7.4, "4000");
  dim(8, -7.4, 10, -7.4, "2000");
  dim(-8, -8.6, 10, -8.6, "18 000");
  dim(-10.4, -5, -10.4, 0, "5000");
  dim(-10.4, 0, -10.4, 5, "5000");
  dim(-11.4, -5, -11.4, 5, "10 000");
  dim(DOOR.x0, 6.3, DOOR.x1, 6.3, "1200");
  dim(0.2, 6.3, 7.8, 6.3, "7600 STRUCTURAL GLAZING");

  // Room labels
  g.textAlign = "center";
  g.textBaseline = "middle";
  const room = (x: number, z: number, name: string, sub: string) => {
    g.fillStyle = ink + "0.95)";
    g.font = font(0.55, 700, fontSans);
    g.fillText(name, X(x), Z(z));
    g.fillStyle = ink + "0.65)";
    g.font = font(0.36, 500);
    g.fillText(sub, X(x), Z(z) + 0.62 * s);
  };
  room(5.2, 3.8, "LIVING", "38.5 m²  ·  FFL +0.250");
  room(-3.75, -3.3, "KITCHEN", "24.0 m²");
  room(2.1, -1.2, "DINING", "16.0 m²");
  room(-2.9, 2.6, "ENTRY", "9.0 m²");
  room(-7.3, 4.4, "STAIR", "UP 16R");
  room(6.2, 9.75, "POOL", "9.5 × 3.5 m");
  room(-4.5, 7.6, "FORECOURT", "STONE PAVING");

  // Leader annotations
  const note = (x: number, z: number, tx: number, tz: number, text: string) => {
    g.strokeStyle = ink + "0.7)";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(X(x), Z(z), 0.09 * s, 0, Math.PI * 2);
    g.fillStyle = ink + "0.9)";
    g.fill();
    g.beginPath();
    g.moveTo(X(x), Z(z));
    g.lineTo(X(tx), Z(tz));
    g.lineTo(X(tx + (tx > x ? 0.8 : -0.8)), Z(tz));
    g.stroke();
    g.font = font(0.34, 500);
    g.textAlign = tx > x ? "left" : "right";
    g.textBaseline = "middle";
    g.fillText(text, X(tx + (tx > x ? 1.0 : -1.0)), Z(tz));
  };
  note(8, 5, 10.6, 6.2, "RCC COLUMN 350×350 TYP.");
  note(9, -2, 12.2, -3.6, "UPPER FLOOR CANTILEVER 2.0 M");
  note(-8, 3, -10.8, 2.6, "LEDGESTONE CLADDING");
  note(-3.75, -1.65, -9.9, -2.2, "MARBLE ISLAND");

  // North arrow
  g.save();
  g.translate(X(19.5), Z(-9.5));
  g.strokeStyle = ink + "0.9)";
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(0, 0, 1.1 * s, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(0, -1.4 * s);
  g.lineTo(0.42 * s, 0.6 * s);
  g.lineTo(0, 0.25 * s);
  g.lineTo(-0.42 * s, 0.6 * s);
  g.closePath();
  g.fillStyle = ink + "0.9)";
  g.fill();
  g.font = font(0.5, 700, fontSans);
  g.textAlign = "center";
  g.fillText("N", 0, -1.75 * s);
  g.restore();

  // Title block
  const tb = { x0: 15.2, z0: 7.6, x1: 23.4, z1: 13.1 };
  g.strokeStyle = ink + "0.8)";
  g.lineWidth = 1.4;
  g.strokeRect(X(tb.x0), Z(tb.z0), (tb.x1 - tb.x0) * s, (tb.z1 - tb.z0) * s);
  g.lineWidth = 1;
  for (const z of [9.2, 10.6, 11.9]) {
    g.beginPath();
    g.moveTo(X(tb.x0), Z(z));
    g.lineTo(X(tb.x1), Z(z));
    g.stroke();
  }
  g.beginPath();
  g.moveTo(X(19.3), Z(10.6));
  g.lineTo(X(19.3), Z(tb.z1));
  g.stroke();
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.fillStyle = ink + "0.95)";
  g.font = font(0.72, 800, fontSans);
  g.fillText("REFLEX", X(tb.x0 + 0.4), Z(8.25));
  g.font = font(0.3, 500);
  g.fillText("INTERIOR AND CONSTRUCTION", X(tb.x0 + 0.4), Z(8.85));
  g.font = font(0.4, 600);
  g.fillText("RESIDENCE 01 — GROUND FLOOR PLAN", X(tb.x0 + 0.4), Z(9.9));
  g.font = font(0.32, 500);
  g.fillText("SCALE 1:100", X(tb.x0 + 0.4), Z(11.25));
  g.fillText("DWG  A-101  REV C", X(19.6), Z(11.25));
  g.fillText("BUILDING BETTER TOMORROWS", X(tb.x0 + 0.4), Z(12.5));
  g.fillText("SHEET 01 / 08", X(19.6), Z(12.5));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
