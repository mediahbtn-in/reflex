import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  WALLS, wallPieces, openingBox, FFL, GF_TOP, L1, UF_TOP, ROOF_TOP, WALL_T, GF, UF, DOOR,
  GRID_X, GRID_Z, UF_GRID_X, UF_GRID_Z, SHEET, makePlanTexture,
} from "./plan";
import * as T from "./textures";
import { rng } from "./textures";

// ─────────────────────────────────────────────────────────────────────────────
// The building is the main character. One scene, one camera, one timeline:
// progress p ∈ [0,1] deterministically drives every element, light and camera
// position, so scrolling forwards and backwards is perfectly reversible.
// ─────────────────────────────────────────────────────────────────────────────

export type Quality = "high" | "medium" | "low";

export type SceneOverrides = {
  camera?: { pos: [number, number, number]; tgt: [number, number, number]; fov: number };
  night?: number;
  shift?: number;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const bump = (p: number, a: number, b: number, c: number, d: number) => seg(p, a, b) * (1 - seg(p, c, d));

// ── Camera path ─────────────────────────────────────────────────────────────
// p, position, target, vertical fov, horizontal subject shift (fraction of
// width, + moves building right to make room for copy), exterior weight
// (exterior shots dolly back on portrait screens; interiors widen fov instead).
type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number]; fov: number; shift: number; ext: number };
export const KEYS: Key[] = [
  { p: 0.0, pos: [1, 37, 1.6], tgt: [1, 0, 1.59], fov: 40, shift: 0.17, ext: 1 },
  { p: 0.06, pos: [2, 30, 11], tgt: [1, 0, 0.6], fov: 40, shift: 0.15, ext: 1 },
  { p: 0.13, pos: [8, 19, 25], tgt: [1, 1.6, 0], fov: 38, shift: 0.13, ext: 1 },
  { p: 0.2, pos: [17, 13, 20], tgt: [1, 0.2, 0], fov: 38, shift: 0.13, ext: 1 },
  { p: 0.27, pos: [21, 10, 14], tgt: [1, 1.5, 0], fov: 38, shift: -0.1, ext: 1 },
  { p: 0.35, pos: [22, 11, 4], tgt: [1, 3, 0], fov: 38, shift: -0.12, ext: 1 },
  { p: 0.43, pos: [15, 7.5, 21], tgt: [1, 3, 0], fov: 38, shift: 0.12, ext: 1 },
  { p: 0.49, pos: [-3, 6, 25], tgt: [0.5, 3, 0], fov: 38, shift: 0.1, ext: 1 },
  { p: 0.56, pos: [-17.5, 3.8, 23.5], tgt: [-0.5, 2.9, 2], fov: 40, shift: -0.13, ext: 1 },
  { p: 0.605, pos: [-6.5, 2.0, 13], tgt: [-2.9, 1.7, 5], fov: 42, shift: -0.04, ext: 0.7 },
  { p: 0.64, pos: [-2.9, 1.72, 9.2], tgt: [-2.9, 1.62, 0], fov: 44, shift: 0, ext: 0.3 },
  { p: 0.675, pos: [-2.9, 1.7, 5.5], tgt: [-2.6, 1.55, 0], fov: 50, shift: 0, ext: 0 },
  { p: 0.715, pos: [-2.5, 1.68, 3.1], tgt: [3.2, 1.15, 0.2], fov: 54, shift: 0.06, ext: 0 },
  { p: 0.76, pos: [-0.4, 1.72, 3.3], tgt: [-3.6, 1.0, -2.0], fov: 52, shift: 0.04, ext: 0 },
  { p: 0.8, pos: [-0.9, 1.5, 0.5], tgt: [-3.6, 0.98, -1.75], fov: 42, shift: -0.06, ext: 0 },
  { p: 0.86, pos: [-2.3, 1.36, 0.15], tgt: [-4.5, 1.02, -2.4], fov: 38, shift: -0.06, ext: 0 },
  { p: 0.9, pos: [3.0, 1.8, 3.2], tgt: [-2.0, 1.3, -2.0], fov: 48, shift: 0, ext: 0 },
  { p: 0.945, pos: [4.6, 2.6, 11.5], tgt: [1.0, 1.9, 0], fov: 44, shift: 0, ext: 0.6 },
  { p: 1.0, pos: [17.5, 5.6, 27], tgt: [1.2, 2.5, 0], fov: 36, shift: 0, ext: 1 },
];

// Stage boundaries used by the overlay / progress indicator.
export const STAGE_STARTS = [0, 0.12, 0.27, 0.4, 0.52, 0.64, 0.79, 0.89];

export type LabelDef = { id: string; pos: [number, number, number]; title: string; sub?: string; range: [number, number, number, number] };

export const LABELS: LabelDef[] = [
  { id: "f1", pos: [4, -0.6, 5], title: "Footing F1", sub: "1300 × 1300 × 300", range: [0.16, 0.18, 0.245, 0.26] },
  { id: "f2", pos: [-2, 0.0, 1.5], title: "Ø16 Rebar", sub: "@ 200 c/c · both ways", range: [0.195, 0.21, 0.25, 0.265] },
  { id: "s1", pos: [8, 2.2, 5], title: "RCC Column", sub: "350 × 350 · M30", range: [0.29, 0.305, 0.37, 0.385] },
  { id: "s2", pos: [9.6, 3.4, 4.1], title: "Cantilever", sub: "2.0 m transfer beam", range: [0.33, 0.345, 0.39, 0.4] },
  { id: "e1", pos: [4, 1.7, 5.1], title: "Structural glazing", sub: "Double glazed · Low-E", range: [0.445, 0.46, 0.5, 0.515] },
  { id: "x1", pos: [-6.2, 1.6, 5.2], title: "Ledgestone", sub: "Natural stone cladding", range: [0.54, 0.555, 0.595, 0.61] },
  { id: "x2", pos: [2.5, 5.2, 4.2], title: "Thermo-oak slats", sub: "Vertical timber rainscreen", range: [0.545, 0.56, 0.595, 0.61] },
  { id: "d1", pos: [-4.1, 1.16, -1.55], title: "Marble", sub: "Calacatta · honed", range: [0.795, 0.81, 0.865, 0.88] },
  { id: "d2", pos: [-2.4, 0.62, -1.28], title: "Natural oak", sub: "Rift-sawn veneer", range: [0.8, 0.815, 0.865, 0.88] },
  { id: "d3", pos: [-3.2, 1.55, -1.98], title: "Brushed metal", sub: "Satin nickel fixtures", range: [0.805, 0.82, 0.865, 0.88] },
  { id: "d4", pos: [-5.2, 1.745, -4.52], title: "Architectural lighting", sub: "2700 K · dimmable", range: [0.81, 0.825, 0.865, 0.88] },
];

// Open-plan living: two interior columns are omitted (transfer beam above).
const skipColumn = (x: number, z: number) => z === 0 && (x === -4 || x === 0);

type AnimKind = "y" | "x" | "z" | "xz" | "xyz" | "rise";
type Anim = { obj: THREE.Object3D; a: number; b: number; kind: AnimKind; base: THREE.Vector3; depth: number };

const linear = (hex: string) => new THREE.Color(hex);

export class BuildScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.05, 900);
  quality: Quality;

  private anims: Anim[] = [];
  private swaps: { mesh: THREE.Mesh; at: number; a: THREE.Material; b: THREE.Material }[] = [];
  private disposables: { dispose: () => void }[] = [];
  private width = 1;
  private height = 1;

  // Curves
  private posCurve: THREE.CatmullRomCurve3;
  private tgtCurve: THREE.CatmullRomCurve3;

  // Handles
  private paper!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private planSheet!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private designWire: THREE.ShaderMaterial[] = [];
  private designWireObjs: THREE.LineSegments[] = [];
  private interiorWire!: THREE.LineBasicMaterial;
  private interiorWireObj!: THREE.LineSegments;
  private rebarMat!: THREE.LineBasicMaterial;
  private cageMat!: THREE.LineBasicMaterial;
  private rebar!: THREE.LineSegments;
  private cage!: THREE.LineSegments;
  private sky!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private hemi!: THREE.HemisphereLight;
  private sun!: THREE.DirectionalLight;
  private interiorLights: THREE.PointLight[] = [];
  private interior = new THREE.Group();
  private door = new THREE.Group();
  private tools: { obj: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3 }[] = [];
  private lawn!: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshStandardMaterial>;
  private M: Record<string, THREE.MeshStandardMaterial> = {};
  private glassGF!: THREE.MeshStandardMaterial;
  private glassUF!: THREE.MeshStandardMaterial;
  private emissives: { mat: THREE.MeshStandardMaterial; color: THREE.Color; base: number; kind: "interior" | "exterior" | "fire" }[] = [];
  private fog = new THREE.Fog(0xf4f7fa, 80, 320);

  constructor(canvas: HTMLCanvasElement, opts: { quality: Quality; fontMono: string; fontSans: string; preserve?: boolean }) {
    this.quality = opts.quality;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: !!opts.preserve,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = opts.quality !== "low";
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04);
    this.scene.environment = envRT.texture;
    this.disposables.push(envRT, pmrem);
    room.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });

    this.scene.fog = this.fog;

    this.posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
    this.tgtCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.tgt)), false, "centripetal");

    this.buildMaterials();
    this.buildEnvironment(opts.fontMono, opts.fontSans);
    this.buildFoundation();
    this.buildStructure();
    this.buildEnclosure();
    this.buildExterior();
    this.buildInterior();
    this.buildTools();
  }

  // ── Materials ─────────────────────────────────────────────────────────────
  private buildMaterials() {
    const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
    const tex = <K extends THREE.Texture>(t: K) => {
      this.disposables.push(t);
      return t;
    };
    this.M = {
      concrete: std({ color: 0xc9cbcc, map: tex(T.concreteTexture()), roughness: 0.92 }),
      footing: std({ color: 0xa9acae, map: tex(T.concreteTexture()), roughness: 0.95 }),
      block: std({ color: 0xc4c6c7, map: tex(T.concreteTexture(true)), roughness: 0.95 }),
      render: std({ color: 0xf1eee8, roughness: 0.88 }),
      plinth: std({ color: 0x3c3d3e, roughness: 0.8 }),
      stone: std({ color: 0xffffff, map: tex(T.stoneTexture()), roughness: 0.9 }),
      stoneDark: std({ color: 0x5b5651, map: tex(T.stoneTexture()), roughness: 0.75 }),
      slats: std({ color: 0xffffff, map: tex(T.slatTexture()), roughness: 0.78 }),
      oak: std({ color: 0xffffff, map: tex(T.woodTexture(3, "#b0814f")), roughness: 0.62 }),
      oakFloor: std({ color: 0xffffff, map: tex(T.woodTexture(4, "#b98c5d")), roughness: 0.55 }),
      oakV: std({ color: 0xffffff, map: tex(T.woodTexture(6, "#a8784c", true)), roughness: 0.62 }),
      deck: std({ color: 0xe6dccf, map: tex(T.woodTexture(8, "#8e6a49")), roughness: 0.85 }),
      marble: std({ color: 0xffffff, map: tex(T.marbleTexture()), roughness: 0.18, metalness: 0 }),
      travertine: std({ color: 0xe8dcc8, map: tex(T.marbleTexture()), roughness: 0.4 }),
      metal: std({ color: 0x24272a, roughness: 0.38, metalness: 0.75 }),
      brushed: std({ color: 0xc4c6c8, roughness: 0.3, metalness: 1 }),
      brass: std({ color: 0xc39a5c, roughness: 0.28, metalness: 1 }),
      fabric: std({ color: 0xd7cdbd, roughness: 1 }),
      fabricDark: std({ color: 0x6e5e4e, roughness: 1 }),
      leather: std({ color: 0x8a5a38, roughness: 0.6 }),
      rug: std({ color: 0xffffff, map: tex(T.rugTexture()), roughness: 1 }),
      paver: std({ color: 0xffffff, map: tex(T.paverTexture(168)), roughness: 0.85 }),
      paverDark: std({ color: 0xffffff, map: tex(T.paverTexture(120)), roughness: 0.85 }),
      earth: std({ color: 0xc2c5c6, roughness: 1 }),
      pit: std({ color: 0x8f9396, roughness: 1 }),
      gravel: std({ color: 0x8f8a83, roughness: 1 }),
      water: std({ color: 0xffffff, map: tex(T.waterTexture()), roughness: 0.06, metalness: 0.15, emissive: 0x0b3a48, emissiveIntensity: 0.35 }),
      trunk: std({ color: 0x5a4a3c, roughness: 1 }),
      leafA: std({ color: 0x5f7246, roughness: 0.95 }),
      leafB: std({ color: 0x768a52, roughness: 0.95 }),
      leafC: std({ color: 0x4c5f3d, roughness: 0.95 }),
      ceramic: std({ color: 0xe9e5de, roughness: 0.5 }),
      potDark: std({ color: 0x3f3a35, roughness: 0.7 }),
      paperBlue: std({ color: 0x2c6fb3, roughness: 0.8 }),
      paperWhite: std({ color: 0xf6f8fb, roughness: 0.9 }),
      wood: std({ color: 0xc89b62, roughness: 0.6 }),
      graphite: std({ color: 0x2b2b2b, roughness: 0.4 }),
      ruler: std({ color: 0xe9eef3, roughness: 0.4, transparent: true, opacity: 0.85 }),
      setsquare: std({ color: 0x8fb6d9, roughness: 0.15, transparent: true, opacity: 0.55, depthWrite: false }),
    };
    Object.values(this.M).forEach((m) => this.disposables.push(m));

    const glass = (color: number, opacity: number) =>
      new THREE.MeshStandardMaterial({
        color, roughness: 0.04, metalness: 0.2, transparent: true, opacity, depthWrite: false,
        envMapIntensity: 1.6, emissive: 0xffb36b, emissiveIntensity: 0, side: THREE.DoubleSide,
      });
    this.glassGF = glass(0x9fb3c2, 0.2);
    this.glassUF = glass(0x4f6372, 0.72);
    this.disposables.push(this.glassGF, this.glassUF);

    const emis = (color: string, base: number, kind: "interior" | "exterior" | "fire") => {
      const c = new THREE.Color(color);
      const mat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 0, roughness: 1 });
      this.emissives.push({ mat, color: c, base, kind });
      this.disposables.push(mat);
      return mat;
    };
    this.M.lampIn = emis("#ffd7a0", 4, "interior");
    this.M.lampOut = emis("#ffc683", 5, "exterior");
    this.M.fire = emis("#ff8a3a", 6, "fire");
  }

  // ── Geometry helpers ──────────────────────────────────────────────────────
  /** Box with world-scaled UVs (uv units per metre) and a pivot (fractions of size). */
  private boxGeo(w: number, h: number, d: number, uv = 1, pivot: [number, number, number] = [0, 0, 0]) {
    const g = new THREE.BoxGeometry(w, h, d);
    const a = g.attributes.uv as THREE.BufferAttribute;
    const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++)
      for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        a.setXY(i, a.getX(i) * dims[f][0] * uv, a.getY(i) * dims[f][1] * uv);
      }
    g.translate(-pivot[0] * w, -pivot[1] * h, -pivot[2] * d);
    return g;
  }

  /** Mesh spanning min→max, with a pivot so it can grow from bottom / start. */
  private boxMesh(min: THREE.Vector3, max: THREE.Vector3, mat: THREE.Material, pivot: [number, number, number] = [0, -0.5, 0], uv = 1) {
    const size = new THREE.Vector3().subVectors(max, min);
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
    const g = this.boxGeo(size.x, size.y, size.z, uv, pivot);
    const m = new THREE.Mesh(g, mat);
    m.position.set(center.x + pivot[0] * size.x, center.y + pivot[1] * size.y, center.z + pivot[2] * size.z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  private anim(obj: THREE.Object3D, a: number, b: number, kind: AnimKind, depth = 1.2) {
    this.anims.push({ obj, a, b, kind, base: obj.position.clone(), depth });
  }

  private add(o: THREE.Object3D, parent: THREE.Object3D = this.scene) {
    parent.add(o);
    return o;
  }

  private v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // Wireframe "design model" — every structural box registered here becomes
  // part of the extruding blueprint.
  private wireBoxes: { min: THREE.Vector3; max: THREE.Vector3; floor: 0 | 1 }[] = [];
  private reg(min: THREE.Vector3, max: THREE.Vector3, floor: 0 | 1 = 0) {
    this.wireBoxes.push({ min: min.clone(), max: max.clone(), floor });
  }

  // ── Environment: sky, paper, grid, ground, site ──────────────────────────
  private buildEnvironment(fontMono: string, fontSans: string) {
    // Sky dome
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: linear("#f4f7fa") },
        uHorizon: { value: linear("#f4f7fa") },
        uBottom: { value: linear("#f4f7fa") },
        uSunDir: { value: new THREE.Vector3(0.5, 0.2, 0.3).normalize() },
        uSunColor: { value: linear("#ffb46b") },
        uSun: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position.z = gl_Position.w; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uHorizon, uBottom, uSunDir, uSunColor; uniform float uSun;
        varying vec3 vDir;
        void main(){
          float h = vDir.y;
          vec3 c = h > 0. ? mix(uHorizon, uTop, pow(smoothstep(-.02, .32, h), .62)) : mix(uHorizon, uBottom, smoothstep(0., -.15, h));
          float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.);
          c += uSunColor * (pow(s, 8.) * .45 + pow(s, 600.) * 2.) * uSun;
          gl_FragColor = vec4(c, 1.);
          #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), skyMat);
    this.sky.renderOrder = -10;
    this.add(this.sky);

    // Lights
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xdfe6ee, 1.4);
    this.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sun.position.set(14, 30, 18);
    this.sun.target.position.set(1, 0, 0);
    this.add(this.sun.target);
    if (this.quality !== "low") {
      this.sun.castShadow = true;
      const sz = this.quality === "high" ? 2048 : 1024;
      this.sun.shadow.mapSize.set(sz, sz);
      const c = this.sun.shadow.camera;
      c.left = -24; c.right = 24; c.top = 20; c.bottom = -20; c.near = 1; c.far = 120;
      this.sun.shadow.bias = -0.0004;
      this.sun.shadow.normalBias = 0.03;
    }
    this.add(this.sun);

    // Ground with an excavation opening for the foundations
    const shape = new THREE.Shape();
    shape.moveTo(-300, -300);
    shape.lineTo(300, -300);
    shape.lineTo(300, 300);
    shape.lineTo(-300, 300);
    const hole = new THREE.Path();
    hole.moveTo(-8.6, -5.6);
    hole.lineTo(-8.6, 5.6);
    hole.lineTo(8.6, 5.6);
    hole.lineTo(8.6, -5.6);
    shape.holes.push(hole);
    const groundGeo = new THREE.ShapeGeometry(shape);
    groundGeo.rotateX(-Math.PI / 2);
    // ShapeGeometry is in XY; after rotation z = -y so flip winding check: hole coordinates mirror in z, symmetric → fine.
    const ground = new THREE.Mesh(groundGeo, this.M.earth);
    ground.receiveShadow = true;
    this.add(ground);

    const lawnTex = T.lawnTexture();
    lawnTex.repeat.set(0.25, 0.25);
    this.disposables.push(lawnTex);
    const lawnGeo = groundGeo.clone();
    const uvs = lawnGeo.attributes.uv as THREE.BufferAttribute;
    const pos = lawnGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uvs.count; i++) uvs.setXY(i, pos.getX(i), pos.getZ(i));
    this.lawn = new THREE.Mesh(
      lawnGeo,
      new THREE.MeshStandardMaterial({ map: lawnTex, roughness: 1, transparent: true, opacity: 0, depthWrite: false }),
    );
    this.lawn.position.y = 0.004;
    this.lawn.receiveShadow = true;
    this.disposables.push(this.lawn.material);
    this.add(this.lawn);

    // Excavation pit
    const pitFloor = this.boxMesh(this.v(-8.6, -1.0, -5.6), this.v(8.6, -0.9, 5.6), this.M.pit, [0, 0, 0]);
    this.add(pitFloor);
    const pw = (x0: number, z0: number, x1: number, z1: number) => this.add(this.boxMesh(this.v(x0, -0.9, z0), this.v(x1, 0, z1), this.M.pit, [0, 0, 0]));
    pw(-8.7, -5.7, 8.7, -5.6);
    pw(-8.7, 5.6, 8.7, 5.7);
    pw(-8.7, -5.6, -8.6, 5.6);
    pw(8.6, -5.6, 8.7, 5.6);

    // Blueprint paper + procedural engineering grid (stays on as the site grid)
    const paperMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      uniforms: {
        uPaper: { value: 1 },
        uGrid: { value: 1 },
        uPaperColor: { value: linear("#f4f7fa") },
        uLine: { value: linear("#174f82") },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vXZ;
        void main(){ vec4 w = modelMatrix * vec4(position,1.); vXZ = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uPaper, uGrid, uTime; uniform vec3 uPaperColor, uLine;
        varying vec2 vXZ;
        float gridLine(vec2 p, float scale){
          vec2 q = p / scale; vec2 g = abs(fract(q - .5) - .5) / fwidth(q);
          return 1. - min(min(g.x, g.y), 1.);
        }
        void main(){
          float minor = gridLine(vXZ, 1.) * .22;
          float major = gridLine(vXZ, 5.) * .5;
          float d = length(vXZ - vec2(1., 0.));
          float fade = 1. - smoothstep(26., 80., d);
          float line = max(minor, major) * fade;
          // a slow survey "scan" brightens the grid lines it passes over
          float scan = smoothstep(3., 0., abs(vXZ.x - (mod(uTime * 3.5, 70.) - 30.))) * uPaper;
          float l = clamp(line * (1. + scan * 1.6), 0., 1.);
          vec3 col = mix(uPaperColor, uLine, l * mix(1., .9, uPaper));
          float a = max(uPaper, l * uGrid);
          gl_FragColor = vec4(col, a);
          #include <colorspace_fragment>
        }`,
    });
    this.paper = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), paperMat);
    this.paper.rotation.x = -Math.PI / 2;
    this.paper.position.y = 0.012;
    this.paper.renderOrder = 1;
    this.add(this.paper);

    const sheetTex = makePlanTexture(fontMono, fontSans, this.quality === "low" ? 2048 : 3072);
    this.disposables.push(sheetTex);
    const sheet = new THREE.Mesh(
      new THREE.PlaneGeometry(SHEET.x1 - SHEET.x0, SHEET.z1 - SHEET.z0),
      new THREE.MeshBasicMaterial({ map: sheetTex, transparent: true, depthWrite: false, toneMapped: false, fog: false }),
    );
    sheet.rotation.x = -Math.PI / 2;
    sheet.position.set((SHEET.x0 + SHEET.x1) / 2, 0.016, (SHEET.z0 + SHEET.z1) / 2);
    sheet.renderOrder = 2;
    this.planSheet = sheet;
    this.add(sheet);
  }

  // ── Stage 02: foundation ─────────────────────────────────────────────────
  private buildFoundation() {
    const M = this.M;
    // column pads
    let i = 0;
    for (const x of GRID_X)
      for (const z of GRID_Z) {
        if (skipColumn(x, z)) continue;
        const m = this.boxMesh(this.v(x - 0.65, -0.9, z - 0.65), this.v(x + 0.65, -0.6, z + 0.65), M.footing);
        this.add(m);
        this.anim(m, 0.14 + i * 0.002, 0.175 + i * 0.002, "rise", 0.5);
        this.reg(this.v(x - 0.65, -0.9, z - 0.65), this.v(x + 0.65, -0.6, z + 0.65));
        i++;
      }
    // strip footings + stem walls on perimeter
    const strips: [number, number, number, number][] = [
      [GF.x0, GF.z1, GF.x1, GF.z1],
      [GF.x0, GF.z0, GF.x1, GF.z0],
      [GF.x0, GF.z0, GF.x0, GF.z1],
      [GF.x1, GF.z0, GF.x1, GF.z1],
      [-4, GF.z0, -4, GF.z1],
      [4, GF.z0, 4, GF.z1],
      [GF.x0, 0, GF.x1, 0],
    ];
    strips.forEach(([x0, z0, x1, z1], k) => {
      const alongX = z0 === z1;
      const half = 0.4;
      const min = alongX ? this.v(x0 - half, -0.9, z0 - half) : this.v(x0 - half, -0.9, z0 - half);
      const max = alongX ? this.v(x1 + half, -0.65, z0 + half) : this.v(x0 + half, -0.65, z1 + half);
      const m = this.boxMesh(min, max, M.footing);
      this.add(m);
      this.anim(m, 0.135 + k * 0.004, 0.17 + k * 0.004, "rise", 0.4);
      if (k < 4) {
        const t = 0.15;
        const smin = alongX ? this.v(x0 - t, -0.65, z0 - t) : this.v(x0 - t, -0.65, z0 - t);
        const smax = alongX ? this.v(x1 + t, -0.05, z0 + t) : this.v(x0 + t, -0.05, z1 + t);
        const s = this.boxMesh(smin, smax, M.concrete);
        this.add(s);
        this.anim(s, 0.17 + k * 0.005, 0.205 + k * 0.005, "y");
        this.reg(smin, smax);
      }
    });

    // Rebar mesh + starter bars (technical overlay)
    const pts: number[] = [];
    for (let x = GF.x0 + 0.2; x <= GF.x1 - 0.2 + 1e-6; x += 0.5) pts.push(x, 0.05, GF.z0 + 0.15, x, 0.05, GF.z1 - 0.15);
    for (let z = GF.z0 + 0.2; z <= GF.z1 - 0.2 + 1e-6; z += 0.5) pts.push(GF.x0 + 0.15, 0.08, z, GF.x1 - 0.15, 0.08, z);
    for (const x of GRID_X)
      for (const z of GRID_Z)
        for (const [dx, dz] of skipColumn(x, z) ? [] : [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) pts.push(x + dx, -0.6, z + dz, x + dx, 1.0, z + dz);
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    this.rebarMat = new THREE.LineBasicMaterial({ color: 0x8a4b2a, transparent: true, opacity: 0, depthWrite: false });
    this.rebar = new THREE.LineSegments(rg, this.rebarMat);
    this.add(this.rebar);
    this.disposables.push(rg, this.rebarMat);

    // Ground slab — "poured" over the rebar
    const slab = this.boxMesh(this.v(GF.x0 - 0.15, -0.05, GF.z0 - 0.15), this.v(GF.x1 + 0.15, FFL, GF.z1 + 0.15), M.concrete);
    this.add(slab);
    this.anim(slab, 0.215, 0.255, "y");
    this.swaps.push({ mesh: slab, at: 0.53, a: M.concrete, b: M.plinth });
    this.reg(this.v(GF.x0 - 0.15, -0.05, GF.z0 - 0.15), this.v(GF.x1 + 0.15, FFL, GF.z1 + 0.15));
  }

  // ── Stage 03: structure ──────────────────────────────────────────────────
  private buildStructure() {
    const M = this.M;
    const c = 0.175;
    const cagePts: number[] = [];
    const cage = (x: number, z: number, y0: number, y1: number) => {
      for (const [dx, dz] of [[-0.12, -0.12], [0.12, -0.12], [0.12, 0.12], [-0.12, 0.12]]) cagePts.push(x + dx, y0, z + dz, x + dx, y1 + 0.4, z + dz);
      for (let y = y0 + 0.2; y < y1; y += 0.3) {
        const sq = [[-0.13, -0.13], [0.13, -0.13], [0.13, 0.13], [-0.13, 0.13]];
        for (let k = 0; k < 4; k++) {
          const [ax, az] = sq[k];
          const [bx, bz] = sq[(k + 1) % 4];
          cagePts.push(x + ax, y, z + az, x + bx, y, z + bz);
        }
      }
    };
    // Ground-floor columns
    let i = 0;
    for (const x of GRID_X)
      for (const z of GRID_Z) {
        if (skipColumn(x, z)) continue;
        const m = this.boxMesh(this.v(x - c, FFL, z - c), this.v(x + c, GF_TOP, z + c), M.concrete);
        this.add(m);
        this.anim(m, 0.27 + i * 0.0022, 0.3 + i * 0.0022, "y");
        this.swaps.push({ mesh: m, at: 0.52, a: M.concrete, b: M.render });
        this.reg(this.v(x - c, FFL, z - c), this.v(x + c, GF_TOP, z + c));
        cage(x, z, FFL, GF_TOP);
        i++;
      }
    // Ground-floor beams (grow from one end)
    const beam = (x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, a: number, b: number, floor: 0 | 1) => {
      const alongX = Math.abs(z1 - z0) < 1e-6;
      const h = 0.15;
      const min = alongX ? this.v(x0, y0, z0 - h) : this.v(x0 - h, y0, z0);
      const max = alongX ? this.v(x1, y1, z0 + h) : this.v(x0 + h, y1, z1);
      const m = this.boxMesh(min, max, M.concrete, alongX ? [-0.5, 0, 0] : [0, 0, -0.5]);
      this.add(m);
      this.anim(m, a, b, alongX ? "x" : "z");
      this.swaps.push({ mesh: m, at: 0.52, a: M.concrete, b: M.render });
      this.reg(min, max, floor);
    };
    let k = 0;
    for (const z of GRID_Z)
      for (let s = 0; s < GRID_X.length - 1; s++, k++) beam(GRID_X[s], z, GRID_X[s + 1], z, GF_TOP - 0.3, GF_TOP, 0.297 + k * 0.0015, 0.315 + k * 0.0015, 0);
    for (const x of GRID_X)
      for (let s = 0; s < GRID_Z.length - 1; s++, k++) beam(x, GRID_Z[s], x, GRID_Z[s + 1], GF_TOP - 0.3, GF_TOP, 0.297 + k * 0.0015, 0.315 + k * 0.0015, 0);
    // Cantilever transfer beams
    for (const z of UF_GRID_Z) beam(GF.x1, z, UF.x1, z, GF_TOP - 0.45, GF_TOP, 0.325, 0.34, 0);

    // First-floor slab (spreads outward from the core)
    const slabA = this.boxMesh(this.v(GF.x0 - 0.15, GF_TOP, GF.z0 - 0.15), this.v(GF.x1 + 0.15, L1, GF.z1 + 0.15), M.concrete, [0, -0.5, 0]);
    const slabB = this.boxMesh(this.v(GF.x1 + 0.15, GF_TOP, UF.z0 - 0.15), this.v(UF.x1 + 0.15, L1, UF.z1 + 0.15), M.concrete, [-0.5, -0.5, 0]);
    this.add(slabA);
    this.add(slabB);
    this.anim(slabA, 0.318, 0.345, "xz");
    this.anim(slabB, 0.338, 0.352, "x");
    this.swaps.push({ mesh: slabA, at: 0.53, a: M.concrete, b: M.render }, { mesh: slabB, at: 0.53, a: M.concrete, b: M.render });
    this.reg(this.v(GF.x0 - 0.15, GF_TOP, GF.z0 - 0.15), this.v(GF.x1 + 0.15, L1, GF.z1 + 0.15));
    this.reg(this.v(GF.x1 + 0.15, GF_TOP, UF.z0 - 0.15), this.v(UF.x1 + 0.15, L1, UF.z1 + 0.15));

    // Upper-floor columns + beams
    i = 0;
    for (const x of UF_GRID_X)
      for (const z of UF_GRID_Z) {
        const m = this.boxMesh(this.v(x - c, L1, z - c), this.v(x + c, UF_TOP, z + c), M.concrete);
        this.add(m);
        this.anim(m, 0.345 + i * 0.003, 0.37 + i * 0.003, "y");
        this.swaps.push({ mesh: m, at: 0.52, a: M.concrete, b: M.render });
        this.reg(this.v(x - c, L1, z - c), this.v(x + c, UF_TOP, z + c), 1);
        cage(x, z, L1, UF_TOP);
        i++;
      }
    k = 0;
    for (const z of UF_GRID_Z)
      for (let s = 0; s < UF_GRID_X.length - 1; s++, k++) beam(UF_GRID_X[s], z, UF_GRID_X[s + 1], z, UF_TOP - 0.3, UF_TOP, 0.37 + k * 0.002, 0.385 + k * 0.002, 1);
    for (const x of UF_GRID_X) beam(x, UF.z0, x, UF.z1, UF_TOP - 0.3, UF_TOP, 0.372 + k++ * 0.002, 0.388 + k * 0.002, 1);

    // Roof slab with overhang
    const rmin = this.v(UF.x0 - 0.4, UF_TOP, UF.z0 - 0.5);
    const rmax = this.v(UF.x1 + 0.5, ROOF_TOP, UF.z1 + 0.6);
    const roof = this.boxMesh(rmin, rmax, M.concrete, [0, -0.5, 0]);
    this.add(roof);
    this.anim(roof, 0.38, 0.4, "xz");
    this.swaps.push({ mesh: roof, at: 0.53, a: M.concrete, b: M.render });
    this.reg(rmin, rmax, 1);

    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(cagePts, 3));
    this.cageMat = new THREE.LineBasicMaterial({ color: 0x2c6fb3, transparent: true, opacity: 0, depthWrite: false });
    this.cage = new THREE.LineSegments(cg, this.cageMat);
    this.add(this.cage);
    this.disposables.push(cg, this.cageMat);
  }

  // ── Stage 04: enclosure — walls, windows, doors ──────────────────────────
  private buildEnclosure() {
    const M = this.M;
    for (const w of WALLS) {
      const pieces = wallPieces(w);
      const gf = w.floor === 0;
      for (const p of pieces) {
        const along = (p.along0 - w.from) / (w.to - w.from + 0.01);
        const wa = (gf ? 0.402 : 0.422) + along * 0.022 + (p.min.y > (gf ? FFL : L1) + 0.1 ? 0.012 : 0);
        const raw = this.boxMesh(p.min, p.max, M.block, [0, -0.5, 0], 1 / 2.4);
        this.add(raw);
        this.anim(raw, wa, wa + 0.022, "y");
        this.reg(p.min, p.max, w.floor);

        // Finished cladding twin — grows over the raw wall during the exterior stage
        const stone = gf && (w.side === "left" || (w.side === "front" && p.max.x <= DOOR.x0 + 0.01));
        const mat = gf ? (stone ? M.stone : M.render) : M.slats;
        const pad = 0.035;
        const cmin = p.min.clone().addScalar(-pad);
        const cmax = p.max.clone().addScalar(pad);
        cmin.y = p.min.y;
        cmax.y = p.max.y;
        const clad = this.boxMesh(cmin, cmax, mat, [0, -0.5, 0], stone ? 0.55 : 1);
        this.add(clad);
        const ca = (gf ? 0.5 : 0.515) + along * 0.03;
        this.anim(clad, ca, ca + 0.028, "y");
      }

      for (const o of w.openings) {
        const box = openingBox(w, o);
        this.reg(box.min, box.max, w.floor);
        if (o.kind === "door") continue;
        const a0 = (gf ? 0.445 : 0.456) + ((o.a - w.from) / (w.to - w.from)) * 0.02;
        this.buildWindow(w.axis, box.min, box.max, gf ? this.glassGF : this.glassUF, a0, a0 + 0.025);
      }
    }

    // Entrance door — pivot on its hinge
    const dh = DOOR.head;
    this.door.position.set(DOOR.x0, FFL, DOOR.z);
    const dw = DOOR.x1 - DOOR.x0;
    const leaf = new THREE.Mesh(this.boxGeo(dw - 0.04, dh - 0.02, 0.07, 1, [-0.5, -0.5, 0]), M.oakV);
    leaf.position.x = 0.02;
    leaf.castShadow = true;
    this.door.add(leaf);
    const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 12), M.brushed);
    pull.position.set(dw - 0.2, 1.15, 0.09);
    const pullIn = pull.clone();
    pullIn.position.z = -0.09;
    this.door.add(pull, pullIn);
    this.add(this.door);
    this.anim(this.door, 0.46, 0.485, "y");
    // Door frame
    const fr = new THREE.Group();
    const fm = (a: THREE.Vector3, b: THREE.Vector3) => fr.add(this.boxMesh(a, b, M.metal, [0, 0, 0]));
    fm(this.v(DOOR.x0 - 0.06, FFL, DOOR.z - 0.17), this.v(DOOR.x0, FFL + dh, DOOR.z + 0.17));
    fm(this.v(DOOR.x1, FFL, DOOR.z - 0.17), this.v(DOOR.x1 + 0.06, FFL + dh, DOOR.z + 0.17));
    fm(this.v(DOOR.x0 - 0.06, FFL + dh, DOOR.z - 0.17), this.v(DOOR.x1 + 0.06, FFL + dh + 0.06, DOOR.z + 0.17));
    this.add(fr);
    fr.position.y = 0;
    this.anim(fr, 0.455, 0.475, "y");

    // Terrace: glass balustrade on the first-floor slab
    const rail = new THREE.Group();
    const railGlass = new THREE.MeshStandardMaterial({
      color: 0xb8cad6, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
    });
    this.disposables.push(railGlass);
    const rg = (a: THREE.Vector3, b: THREE.Vector3) => {
      const m = this.boxMesh(a, b, railGlass, [0, -0.5, 0]);
      m.castShadow = false;
      rail.add(m);
    };
    rg(this.v(GF.x0 - 0.1, L1, GF.z1 + 0.05), this.v(UF.x0, L1 + 1.05, GF.z1 + 0.09));
    rg(this.v(GF.x0 - 0.1, L1, GF.z0 - 0.09), this.v(GF.x0 - 0.06, L1 + 1.05, GF.z1 + 0.09));
    rg(this.v(GF.x0 - 0.1, L1, GF.z0 - 0.09), this.v(UF.x0, L1 + 1.05, GF.z0 - 0.05));
    this.add(rail);
    this.anim(rail, 0.475, 0.5, "y");
  }

  private buildWindow(axis: "x" | "z", min: THREE.Vector3, max: THREE.Vector3, glass: THREE.Material, a: number, b: number) {
    const M = this.M;
    const f = 0.06;
    const depth = 0.12;
    const geos: THREE.BufferGeometry[] = [];
    const along0 = axis === "x" ? min.x : min.z;
    const along1 = axis === "x" ? max.x : max.z;
    const mid = axis === "x" ? (min.z + max.z) / 2 : (min.x + max.x) / 2;
    const y0 = min.y;
    const y1 = max.y;
    const piece = (a0: number, a1: number, b0: number, b1: number) => {
      const w = a1 - a0;
      const h = b1 - b0;
      const g = axis === "x" ? this.boxGeo(w, h, depth) : this.boxGeo(depth, h, w);
      if (axis === "x") g.translate((a0 + a1) / 2, (b0 + b1) / 2 - y0, mid);
      else g.translate(mid, (b0 + b1) / 2 - y0, (a0 + a1) / 2);
      geos.push(g);
    };
    piece(along0, along1, y0, y0 + f);
    piece(along0, along1, y1 - f, y1);
    piece(along0, along0 + f, y0, y1);
    piece(along1 - f, along1, y0, y1);
    const len = along1 - along0;
    const n = Math.max(1, Math.round(len / 1.9));
    for (let i = 1; i < n; i++) {
      const c = along0 + (len * i) / n;
      piece(c - f / 2, c + f / 2, y0, y1);
    }
    const frame = new THREE.Mesh(mergeGeometries(geos), M.metal);
    geos.forEach((g) => g.dispose());
    frame.position.y = y0;
    frame.castShadow = true;
    this.add(frame);
    this.anim(frame, a, b, "y");

    const gw = len - 0.02;
    const gh = y1 - y0 - 0.02;
    const gg = axis === "x" ? new THREE.BoxGeometry(gw, gh, 0.02) : new THREE.BoxGeometry(0.02, gh, gw);
    gg.translate(0, gh / 2, 0);
    const pane = new THREE.Mesh(gg, glass);
    if (axis === "x") pane.position.set((along0 + along1) / 2, y0 + 0.01, mid);
    else pane.position.set(mid, y0 + 0.01, (along0 + along1) / 2);
    pane.renderOrder = 5;
    this.add(pane);
    this.anim(pane, a + 0.006, b + 0.006, "y");
  }

  // ── Stage 05: exterior — landscape, materials, lighting ──────────────────
  private buildExterior() {
    const M = this.M;
    const r = rng(42);

    // Backfill / gravel plinth around the house
    const fill = (x0: number, z0: number, x1: number, z1: number) => {
      const m = this.boxMesh(this.v(x0, -0.9, z0), this.v(x1, 0.02, z1), M.gravel, [0, -0.5, 0]);
      this.add(m);
      this.anim(m, 0.5, 0.53, "rise", 1);
    };
    fill(-8.6, 5.15, 8.6, 5.6);
    fill(-8.6, -5.6, 8.6, -5.15);
    fill(-8.6, -5.15, -8.15, 5.15);
    fill(8.15, -5.15, 8.6, 5.15);

    // Paving, deck, pool
    const slabAt = (x0: number, z0: number, x1: number, z1: number, mat: THREE.Material, a: number, y = 0.06, uv = 1) => {
      const m = this.boxMesh(this.v(x0, -0.05, z0), this.v(x1, y, z1), mat, [0, -0.5, 0], uv);
      m.castShadow = false;
      this.add(m);
      this.anim(m, a, a + 0.03, "rise", 0.3);
      return m;
    };
    slabAt(-8.6, 5.6, -0.5, 9.5, M.paver, 0.515, 0.06, 0.5);
    slabAt(-7.4, 9.5, -3.2, 40, M.paverDark, 0.52, 0.04, 0.5);
    slabAt(-0.5, 5.6, 12.6, 7.3, M.deck, 0.522, 0.12);
    // Pool coping + water
    slabAt(0.8, 7.3, 11.7, 8.0, M.paver, 0.525, 0.1, 0.5);
    slabAt(0.8, 11.5, 11.7, 12.2, M.paver, 0.525, 0.1, 0.5);
    slabAt(0.8, 8.0, 1.5, 11.5, M.paver, 0.525, 0.1, 0.5);
    slabAt(11.0, 8.0, 11.7, 11.5, M.paver, 0.525, 0.1, 0.5);
    const water = slabAt(1.5, 8.0, 11.0, 11.5, M.water, 0.53, 0.03, 0.25);
    water.receiveShadow = true;
    // Stepping stones on the lawn to the side terrace
    for (let i = 0; i < 6; i++) slabAt(12.9 + (i % 2) * 0.2, 6.5 - i * 1.1, 13.9 + (i % 2) * 0.2, 7.1 - i * 1.1, M.paver, 0.53 + i * 0.002, 0.05, 0.5);

    // Planters + shrubs flanking the entrance
    const planter = (x: number, z: number, w: number, d: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.add(this.boxMesh(this.v(-w / 2, 0, -d / 2), this.v(w / 2, 0.55, d / 2), M.stoneDark, [0, -0.5, 0], 0.6));
      const n = Math.max(2, Math.round(w / 0.5));
      for (let i = 0; i < n; i++) {
        const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32 + r() * 0.14, 1), i % 2 ? M.leafB : M.leafA);
        s.position.set(-w / 2 + 0.25 + (i * (w - 0.5)) / Math.max(1, n - 1), 0.7 + r() * 0.1, (r() - 0.5) * d * 0.4);
        s.castShadow = true;
        g.add(s);
      }
      this.add(g);
      this.anim(g, 0.535 + r() * 0.02, 0.565 + r() * 0.02, "xyz");
    };
    planter(-5.6, 6.1, 3.4, 0.7);
    planter(-1.25, 6.1, 1.2, 0.7);
    planter(-12, 4, 0.9, 6);

    // Hedge along the back boundary
    for (let i = 0; i < 18; i++) {
      const h = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.4 + r() * 0.2, 1.0, 2, 0.35), i % 3 ? M.leafC : M.leafA);
      h.geometry.translate(0, 0.7, 0);
      h.position.set(-20 + i * 2.15, 0, -13.5);
      h.castShadow = true;
      this.add(h);
      this.anim(h, 0.53 + i * 0.001, 0.56 + i * 0.001, "y");
    }

    // Trees — sculpted canopies, grow from the ground
    const trees: [number, number, number][] = [
      [-13, -9, 1.25], [-5, -10.5, 1.0], [5, -11, 1.35], [14, -8, 1.15], [17, 1.5, 1.0], [-14.5, 9, 1.1],
      [-12.5, 18, 0.9], [16.5, 15.5, 0.95], [-17, -2, 0.85], [22, -4, 1.1],
    ];
    if (this.quality === "low") trees.splice(7);
    trees.forEach(([x, z, s], i) => {
      const t = this.makeTree(r, s);
      t.position.set(x, 0, z);
      this.add(t);
      this.anim(t, 0.525 + i * 0.004, 0.565 + i * 0.004, "xyz");
    });

    // Distant tree line — reads as a silhouette against the sky through the fog
    {
      const n = this.quality === "low" ? 70 : 140;
      const geo = new THREE.IcosahedronGeometry(1, 1);
      geo.translate(0, 0.6, 0);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3d4a34, roughness: 1, flatShading: true });
      this.disposables.push(geo, mat);
      const inst = new THREE.InstancedMesh(geo, mat, n);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 0.05;
        const d = 115 + r() * 60;
        const sc = 4.5 + r() * 5;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6);
        m4.compose(new THREE.Vector3(Math.cos(a) * d, -1.2, Math.sin(a) * d * 0.85), q, new THREE.Vector3(sc, sc * (0.8 + r() * 0.7), sc));
        inst.setMatrixAt(i, m4);
      }
      const g = new THREE.Group();
      g.add(inst);
      this.add(g);
      this.anim(g, 0.5, 0.56, "y");
    }

    // Exterior lighting: soffit strips, bollards, step lights
    const strip = (min: THREE.Vector3, max: THREE.Vector3) => {
      const m = this.boxMesh(min, max, M.lampOut, [0, -0.5, 0]);
      m.castShadow = false;
      this.add(m);
      this.anim(m, 0.53, 0.55, "y");
    };
    strip(this.v(GF.x1 + 0.3, GF_TOP - 0.02, UF.z1 - 0.2), this.v(UF.x1, GF_TOP - 0.005, UF.z1 - 0.12));
    strip(this.v(GF.x1 + 0.3, GF_TOP - 0.02, UF.z0 + 0.12), this.v(UF.x1, GF_TOP - 0.005, UF.z0 + 0.2));
    strip(this.v(UF.x0 - 0.3, UF_TOP - 0.02, UF.z1 + 0.45), this.v(UF.x1 + 0.4, UF_TOP - 0.005, UF.z1 + 0.52));
    strip(this.v(-8.4, 0.03, 5.62), this.v(-0.6, 0.05, 5.7));
    for (let i = 0; i < 6; i++) {
      const z = 10.5 + i * 3.2;
      for (const x of [-7.7, -2.9]) {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.add(this.boxMesh(this.v(-0.07, 0, -0.07), this.v(0.07, 0.62, 0.07), M.metal, [0, -0.5, 0]));
        g.add(this.boxMesh(this.v(-0.072, 0.5, -0.072), this.v(0.072, 0.58, 0.072), M.lampOut, [0, -0.5, 0]));
        this.add(g);
        this.anim(g, 0.545 + i * 0.002, 0.565 + i * 0.002, "y");
      }
    }
    // Facade uplights
    for (const x of [-7.4, -6.2, -5.0, -3.9]) strip(this.v(x - 0.08, 0.02, 5.25), this.v(x + 0.08, 0.06, 5.4));
  }

  private makeTree(r: () => number, s: number) {
    const g = new THREE.Group();
    const h = (3.2 + r() * 1.6) * s;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.2 * s, h, 7), this.M.trunk);
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    g.add(trunk);
    const leaves = [this.M.leafA, this.M.leafB, this.M.leafC];
    const n = 5 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const rad = (1.0 + r() * 0.9) * s;
      const geo = new THREE.IcosahedronGeometry(rad, 2);
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < p.count; k++) {
        const v = new THREE.Vector3().fromBufferAttribute(p, k);
        const n2 = Math.sin(v.x * 3.1 + i) * Math.cos(v.y * 2.7) * Math.sin(v.z * 3.3 + i * 2);
        v.multiplyScalar(1 + n2 * 0.14);
        p.setXYZ(k, v.x, v.y * 0.85, v.z);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, leaves[i % 3]);
      const a = r() * Math.PI * 2;
      const d = r() * 1.2 * s;
      m.position.set(Math.cos(a) * d, h + (r() - 0.3) * 1.6 * s, Math.sin(a) * d);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
    return g;
  }

  // ── Stage 06/07: interior ────────────────────────────────────────────────
  private buildInterior() {
    const M = this.M;
    const G = this.interior;
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const put = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const g = geo.index ? geo.toNonIndexed() : geo;
      if (g !== geo) geo.dispose();
      if (!g.attributes.uv) {
        g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      }
      const list = batches.get(mat) ?? [];
      list.push(g);
      batches.set(mat, list);
    };
    const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: THREE.Material, uv = 1) => {
      const g = this.boxGeo(x1 - x0, y1 - y0, z1 - z0, uv);
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      put(g, mat);
    };
    const rbox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: THREE.Material, rad = 0.06) => {
      const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 3, rad);
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      put(g, mat);
    };
    const cyl = (x: number, y0: number, z: number, rt: number, rb: number, h: number, mat: THREE.Material, seg = 24) => {
      const g = new THREE.CylinderGeometry(rt, rb, h, seg);
      g.translate(x, y0 + h / 2, z);
      put(g, mat);
    };
    const F = FFL + 0.01;
    const CEIL = GF_TOP - 0.32;

    // Floor + ceiling (with stair void)
    box(GF.x0 + 0.15, FFL, GF.z0 + 0.15, GF.x1 - 0.15, F, GF.z1 - 0.15, M.oakFloor, 0.5);
    box(GF.x0 + 0.15, CEIL, GF.z0 + 0.15, -6.7, CEIL + 0.02, -1.0, M.render);
    box(GF.x0 + 0.15, CEIL, 1.5, -6.7, CEIL + 0.02, GF.z1 - 0.15, M.render);
    box(-6.7, CEIL, GF.z0 + 0.15, GF.x1 - 0.15, CEIL + 0.02, GF.z1 - 0.15, M.render);
    // Recessed linear lights in the ceiling
    for (const x of [2.5, 5.5]) box(x - 0.03, CEIL - 0.005, -3.8, x + 0.03, CEIL, 3.8, M.lampIn);

    // ── Living: feature fireplace wall, sofa, rug, coffee table ──
    box(3.7, F, -4.8, 7.7, CEIL, -4.6, M.stoneDark, 0.6);
    box(4.3, 0.75, -4.6, 7.1, 0.95, -4.58, M.fire);
    box(3.7, F, -4.58, 7.7, 0.55, -4.2, M.oak);
    box(3.2, F, -0.6, 7.2, F + 0.012, 3.2, M.rug);
    rbox(3.3, F, 1.0, 7.0, 0.66, 2.2, M.fabric);
    rbox(3.3, 0.6, 1.8, 7.0, 1.08, 2.2, M.fabric, 0.1);
    rbox(6.0, F, -0.6, 7.0, 0.66, 1.0, M.fabric);
    rbox(6.6, 0.6, -0.6, 7.0, 1.08, 1.8, M.fabric, 0.1);
    for (let i = 0; i < 3; i++) rbox(3.45 + i * 0.85, 0.66, 1.05, 4.25 + i * 0.85, 0.8, 1.75, M.fabric, 0.07);
    rbox(4.9, 0.66, 1.55, 5.4, 1.02, 1.75, M.fabricDark, 0.08);
    cyl(4.8, F, 0.2, 0.58, 0.58, 0.1, M.travertine, 40);
    cyl(4.8, F + 0.1, 0.2, 0.32, 0.32, 0.26, M.travertine, 32);
    cyl(4.6, F + 0.36, 0.05, 0.08, 0.1, 0.12, M.ceramic, 16);
    // Armchair
    rbox(3.0, F, -1.5, 3.9, 0.62, -0.6, M.leather, 0.08);
    rbox(3.0, 0.55, -1.5, 3.15, 1.0, -0.6, M.leather, 0.06);
    // Arc floor lamp
    cyl(7.45, F, 2.6, 0.18, 0.18, 0.04, M.brushed);
    const arc = new THREE.TubeGeometry(
      new THREE.QuadraticBezierCurve3(this.v(7.45, F, 2.6), this.v(7.4, 3.0, 2.2), this.v(6.0, 2.1, 1.0)),
      24, 0.015, 6,
    );
    put(arc, M.brushed);
    const shade = new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    shade.translate(6.0, 1.9, 1.0);
    put(shade, M.brushed);
    cyl(6.0, 1.86, 1.0, 0.16, 0.16, 0.02, M.lampIn);

    // ── Dining ──
    box(0.9, 0.98, -3.7, 3.3, 1.02, -2.5, M.oak);
    box(1.1, F, -3.25, 1.18, 0.98, -2.95, M.metal);
    box(3.02, F, -3.25, 3.1, 0.98, -2.95, M.metal);
    for (let i = 0; i < 3; i++)
      for (const side of [-1, 1]) {
        const x = 1.15 + i * 0.8;
        const z = side < 0 ? -4.05 : -2.15;
        rbox(x, 0.68, z - 0.22, x + 0.46, 0.74, z + 0.22, M.fabric, 0.03);
        rbox(x, 0.74, side < 0 ? z - 0.24 : z + 0.18, x + 0.46, 1.15, side < 0 ? z - 0.18 : z + 0.24, M.fabric, 0.03);
        box(x + 0.2, F, z - 0.03, x + 0.26, 0.68, z + 0.03, M.metal);
      }
    box(1.0, 2.0, -3.15, 3.2, 2.05, -3.05, M.brass);
    box(1.05, 1.995, -3.13, 3.15, 2.0, -3.07, M.lampIn);
    box(1.08, 2.05, -3.11, 1.09, CEIL, -3.09, M.metal);
    box(3.11, 2.05, -3.11, 3.12, CEIL, -3.09, M.metal);

    // ── Kitchen run (back wall) ──
    const KZ0 = -4.8;
    const KZ1 = -4.22;
    box(-7.6, F, KZ0, -6.0, 2.66, KZ1, M.oakV);
    box(-2.6, F, KZ0, -1.4, 2.66, KZ1, M.oakV);
    box(-6.0, F, KZ0, -2.6, 1.1, KZ1, M.oakV);
    box(-6.02, 1.1, KZ0, -2.58, 1.14, KZ1 + 0.03, M.marble, 0.6);
    box(-6.0, 1.14, KZ0, -2.6, 2.3, KZ0 + 0.03, M.marble, 0.6);
    box(-6.0, 1.75, KZ0, -2.6, 1.79, KZ0 + 0.3, M.oak);
    box(-5.95, 1.745, KZ0 + 0.26, -2.65, 1.75, KZ0 + 0.28, M.lampIn);
    for (const x of [-6.85, -6.05]) box(x - 0.015, 0.9, KZ1, x + 0.015, 1.9, KZ1 + 0.03, M.brushed);
    for (const x of [-2.55, -1.95]) box(x - 0.015, 0.9, KZ1, x + 0.015, 1.9, KZ1 + 0.03, M.brushed);
    for (let i = 0; i < 4; i++) box(-5.85 + i * 0.85, 0.98, KZ1, -5.35 + i * 0.85, 1.0, KZ1 + 0.03, M.brushed);
    // Range hood (brushed)
    box(-4.6, 2.3, KZ0, -3.6, 2.66, KZ0 + 0.45, M.brushed);

    // ── Island: oak base, marble waterfall top, faucet, pendants, stools ──
    box(-5.5, F, -2.25, -2.0, 1.1, -1.35, M.oak);
    box(-5.62, 1.1, -2.32, -1.88, 1.16, -1.0, M.marble, 0.5);
    box(-5.62, F, -2.32, -5.56, 1.1, -1.0, M.marble, 0.5);
    box(-1.94, F, -2.32, -1.88, 1.1, -1.0, M.marble, 0.5);
    box(-3.55, 1.159, -2.2, -2.85, 1.162, -1.75, M.metal);
    cyl(-3.2, 1.16, -2.18, 0.022, 0.026, 0.38, M.brushed, 16);
    const spoutG = new THREE.TorusGeometry(0.12, 0.016, 8, 24, Math.PI);
    spoutG.rotateY(Math.PI / 2);
    spoutG.translate(-3.2, 1.54, -2.06);
    put(spoutG, M.brushed);
    for (const x of [-4.7, -3.75, -2.8]) {
      const dome = new THREE.SphereGeometry(0.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(x, 2.02, -1.75);
      put(dome, M.brass);
      cyl(x, 2.0, -1.75, 0.17, 0.17, 0.02, M.lampIn);
      cyl(x, 2.22, -1.75, 0.004, 0.004, CEIL - 2.22, M.metal, 6);
    }
    for (const x of [-4.8, -3.75, -2.7]) {
      cyl(x, 0.78, -0.62, 0.2, 0.2, 0.06, M.leather, 24);
      cyl(x, F, -0.62, 0.02, 0.03, 0.52, M.metal, 8);
      cyl(x, F, -0.62, 0.18, 0.18, 0.015, M.metal, 24);
      cyl(x, 0.35, -0.62, 0.16, 0.16, 0.015, M.metal, 24);
    }

    // ── Floating stair + slatted oak screen ──
    for (let i = 0; i < 16; i++) {
      const z = 3.6 - i * 0.28;
      const y = FFL + (i + 1) * 0.203;
      box(-7.85, y - 0.06, z - 0.28, -6.75, y, z, M.oak);
    }
    for (let i = 0; i < 26; i++) {
      const z = 0.6 + i * 0.12;
      box(-6.55, F, z, -6.5, CEIL, z + 0.045, M.oak);
    }

    // ── Plants ──
    const plant = (x: number, z: number, s: number) => {
      cyl(x, F, z, 0.26 * s, 0.2 * s, 0.55 * s, M.potDark, 24);
      for (let i = 0; i < 5; i++) {
        const g = new THREE.IcosahedronGeometry((0.32 + (i % 3) * 0.06) * s, 1);
        g.translate(x + Math.cos(i * 1.3) * 0.18 * s, F + (0.75 + (i % 3) * 0.25) * s, z + Math.sin(i * 1.3) * 0.18 * s);
        put(g, i % 2 ? M.leafB : M.leafA);
      }
    };
    plant(7.45, -3.9, 1.3);
    plant(7.5, 4.45, 1.0);
    plant(0.4, -4.4, 0.9);

    // ── Entry: console + art ──
    box(-1.7, 0.8, 4.4, -0.5, 0.85, 4.75, M.oak);
    box(-1.65, F, 4.45, -1.6, 0.8, 4.7, M.metal);
    box(-0.6, F, 4.45, -0.55, 0.8, 4.7, M.metal);
    box(-1.55, 1.2, 4.77, -0.65, 2.3, 4.79, M.travertine);

    for (const [mat, geos] of batches) {
      const merged = mergeGeometries(geos);
      geos.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = mat !== this.M.rug && mat !== this.M.oakFloor;
      mesh.receiveShadow = true;
      G.add(mesh);
    }
    G.visible = false;
    this.add(G);

    // Interior blueprint overlay (edges of the furniture)
    const edgeGeos: THREE.BufferGeometry[] = [];
    G.children.forEach((c) => {
      const m = c as THREE.Mesh;
      if (m.material === M.oakFloor || m.material === M.render || m.material === M.lampIn) return;
      edgeGeos.push(new THREE.EdgesGeometry(m.geometry, 35));
    });
    const eg = mergeGeometries(edgeGeos);
    edgeGeos.forEach((g) => g.dispose());
    this.interiorWire = new THREE.LineBasicMaterial({ color: 0x5aa0e6, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const ew = new THREE.LineSegments(eg, this.interiorWire);
    this.interiorWireObj = ew;
    ew.renderOrder = 6;
    G.add(ew);
    this.disposables.push(this.interiorWire);

    // Interior lights
    const pl = (x: number, y: number, z: number, d: number) => {
      const l = new THREE.PointLight(0xffc98f, 0, d, 2);
      l.position.set(x, y, z);
      G.add(l);
      this.interiorLights.push(l);
    };
    pl(-3.75, 2.3, -1.6, 9);
    pl(5.0, 2.5, 0.8, 10);
    pl(2.1, 2.2, -3.0, 7);
    pl(-2.9, 2.5, 3.6, 7);

    // ── Design wireframe (built last so it knows every registered box) ──
    this.buildDesignWire();
  }

  private buildDesignWire() {
    const make = (floor: 0 | 1) => {
      const pos: number[] = [];
      const ord: number[] = [];
      const r = rng(floor + 3);
      for (const b of this.wireBoxes.filter((b) => b.floor === floor)) {
        const { min: a, max: c } = b;
        const corners = [
          [a.x, a.y, a.z], [c.x, a.y, a.z], [c.x, a.y, c.z], [a.x, a.y, c.z],
          [a.x, c.y, a.z], [c.x, c.y, a.z], [c.x, c.y, c.z], [a.x, c.y, c.z],
        ];
        const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
        const o = clamp01(((a.x + c.x) / 2 + 9) / 21 * 0.75 + ((a.z + c.z) / 2 + 6) / 12 * 0.1 + r() * 0.15);
        for (const [i, j] of edges) {
          pos.push(...corners[i], ...corners[j]);
          ord.push(o, o);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("aOrder", new THREE.Float32BufferAttribute(ord, 1));
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        fog: false,
        uniforms: {
          uExtrude: { value: 0 },
          uDraw: { value: 0 },
          uOpacity: { value: 1 },
          uColor: { value: linear("#174f82") },
          uTime: { value: 0 },
          uFloorDim: { value: floor === 1 ? 0.45 : 1 },
        },
        vertexShader: /* glsl */ `
          attribute float aOrder; uniform float uExtrude; varying float vOrder; varying vec3 vW;
          void main(){
            vec3 p = position;
            p.y = mix(0.03 + max(p.y, 0.) * 0.0, p.y, uExtrude);
            vOrder = aOrder;
            vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uDraw, uOpacity, uTime, uFloorDim, uExtrude; uniform vec3 uColor;
          varying float vOrder; varying vec3 vW;
          void main(){
            if (vOrder > uDraw) discard;
            float edge = smoothstep(uDraw - .06, uDraw, vOrder);
            float scan = smoothstep(2., 0., abs(vW.x - (mod(uTime * 3.5, 70.) - 30.)));
            float dim = mix(uFloorDim, 1., uExtrude);
            vec3 c = mix(uColor, vec3(.55,.8,1.), edge * .8 + scan * .25);
            gl_FragColor = vec4(c, uOpacity * dim * (0.85 + scan * .15));
            #include <colorspace_fragment>
          }`,
      });
      const ls = new THREE.LineSegments(g, mat);
      ls.renderOrder = 4;
      ls.frustumCulled = false;
      this.add(ls);
      this.disposables.push(g, mat);
      this.designWire.push(mat);
      this.designWireObjs.push(ls);
    };
    make(0);
    make(1);
  }

  // ── Drawing tools lying on the blueprint ─────────────────────────────────
  private buildTools() {
    const M = this.M;
    const reg = (o: THREE.Object3D, dir: [number, number]) => {
      this.tools.push({ obj: o, base: o.position.clone(), dir: new THREE.Vector3(dir[0], 0, dir[1]).normalize() });
      this.add(o);
    };
    // Rolled blueprint
    const roll = new THREE.Group();
    const rollBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 7, 40, 1, true), M.paperBlue);
    rollBody.rotation.z = Math.PI / 2;
    const rollIn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7.02, 40, 1, true), M.paperWhite);
    rollIn.rotation.z = Math.PI / 2;
    (rollIn.material as THREE.Material).side = THREE.DoubleSide;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.12, 40), M.wood);
    band.rotation.z = Math.PI / 2;
    band.position.x = 1.6;
    roll.add(rollBody, rollIn, band);
    roll.position.set(14.5, 0.43, -8.2);
    roll.rotation.y = 0.45;
    roll.traverse((o) => (o.castShadow = true));
    reg(roll, [1, -0.6]);

    // Pencil
    const pencil = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.2, 6), M.wood);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 6), M.paperWhite);
    tip.position.y = 2.95;
    const lead = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), M.graphite);
    lead.position.y = 3.25;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.4, 12), M.brushed);
    cap.position.y = -2.75;
    pencil.add(body, tip, lead, cap);
    pencil.rotation.set(Math.PI / 2, 0, 0.9);
    pencil.position.set(14.2, 0.17, 3.2);
    pencil.traverse((o) => (o.castShadow = true));
    reg(pencil, [1, 0.3]);

    // Set square (triangle with a cut-out)
    const tri = new THREE.Shape();
    tri.moveTo(0, 0);
    tri.lineTo(5.5, 0);
    tri.lineTo(0, 4.2);
    tri.lineTo(0, 0);
    const holeT = new THREE.Path();
    holeT.moveTo(0.9, 0.7);
    holeT.lineTo(3.2, 0.7);
    holeT.lineTo(0.9, 2.45);
    holeT.lineTo(0.9, 0.7);
    tri.holes.push(holeT);
    const sq = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.06, bevelEnabled: false }), M.setsquare);
    sq.rotation.x = -Math.PI / 2;
    sq.position.set(-15.5, 0.05, -6);
    sq.rotation.z = 0.25;
    reg(sq, [-1, -0.5]);

    // Scale ruler (triangular)
    const ruler = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 9, 3), M.ruler);
    ruler.rotation.set(0, 0, Math.PI / 2);
    ruler.position.set(4, 0.18, 12.6);
    ruler.castShadow = true;
    reg(ruler, [0.2, 1]);
  }

  // ── Runtime ──────────────────────────────────────────────────────────────
  resize(w: number, h: number, dpr: number) {
    this.width = w;
    this.height = h;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private col = new THREE.Color();
  private mixC(out: THREE.Color, stops: [string, number][]) {
    out.set(stops[0][0]);
    for (let i = 1; i < stops.length; i++) out.lerp(this.col.set(stops[i][0]), stops[i][1]);
    return out;
  }

  private tmpV = new THREE.Vector3();
  private tmpT = new THREE.Vector3();

  /** Drive every element from scroll progress. `intro` animates the plan drawing in on load. */
  update(p: number, time: number, intro = 1, o: SceneOverrides = {}) {
    // ── Elements ──
    for (const a of this.anims) {
      const t = easeIO(seg(p, a.a, a.b));
      const vis = t > 0.001;
      a.obj.visible = vis;
      if (!vis) continue;
      const s = Math.max(t, 0.0001);
      switch (a.kind) {
        case "y": a.obj.scale.set(1, s, 1); break;
        case "x": a.obj.scale.set(s, 1, 1); break;
        case "z": a.obj.scale.set(1, 1, s); break;
        case "xz": a.obj.scale.set(s, 1, s); break;
        case "xyz": { const e = easeOut(seg(p, a.a, a.b)); a.obj.scale.setScalar(Math.max(e, 0.0001)); break; }
        case "rise": a.obj.position.y = a.base.y - (1 - t) * a.depth; break;
      }
    }
    for (const s of this.swaps) s.mesh.material = p >= s.at ? s.b : s.a;

    // ── Blueprint ──
    const paperA = 1 - smooth(seg(p, 0.085, 0.17));
    const extrude = easeIO(seg(p, 0.03, 0.125));
    const pm = this.paper.material.uniforms;
    pm.uPaper.value = paperA;
    pm.uGrid.value = 1 - seg(p, 0.4, 0.5);
    pm.uTime.value = time;
    this.paper.visible = pm.uGrid.value > 0.001 || paperA > 0.001;
    this.planSheet.material.opacity = paperA * smooth(clamp01(intro * 1.2 - 0.1)) * (1 - seg(p, 0.02, 0.09) * 0.55);
    this.planSheet.visible = this.planSheet.material.opacity > 0.001;

    let wireO = 1;
    wireO = lerp(wireO, 0.5, seg(p, 0.12, 0.2));
    wireO = lerp(wireO, 0.3, seg(p, 0.3, 0.42));
    wireO *= 1 - seg(p, 0.5, 0.56);
    const wireObjs = this.designWireObjs;
    const wireCol = this.mixC(this.col.clone(), [["#174f82", 1], ["#2c6fb3", seg(p, 0.12, 0.25)]]);
    for (const m of this.designWire) {
      m.uniforms.uExtrude.value = extrude;
      m.uniforms.uDraw.value = intro * 1.05;
      m.uniforms.uOpacity.value = wireO;
      wireObjs.forEach((o) => (o.visible = wireO > 0.001));
      m.uniforms.uTime.value = time;
      (m.uniforms.uColor.value as THREE.Color).copy(wireCol);
    }
    this.rebarMat.opacity = seg(p, 0.18, 0.205) * (1 - seg(p, 0.245, 0.26)) * 0.9;
    this.cageMat.opacity = bump(p, 0.255, 0.275, 0.335, 0.375) * 0.75;
    this.interiorWire.opacity = bump(p, 0.645, 0.67, 0.7, 0.74) * 0.7;
    this.rebar.visible = this.rebarMat.opacity > 0.001;
    this.cage.visible = this.cageMat.opacity > 0.001;
    this.interiorWireObj.visible = this.interiorWire.opacity > 0.001;

    // Drawing tools slide off the sheet
    const tOff = easeIO(seg(p, 0.012, 0.085));
    for (const t of this.tools) {
      t.obj.position.copy(t.base).addScaledVector(t.dir, tOff * 14);
      t.obj.visible = tOff < 0.999 && paperA > 0.01;
    }

    // ── Atmosphere ──
    const night = o.night ?? 0;
    const site = seg(p, 0.1, 0.22);
    const day = seg(p, 0.48, 0.6);
    const gold = smooth(seg(p, 0.875, 0.975));
    const warm = seg(p, 0.5, 0.62);
    const u = this.sky.material.uniforms;
    this.mixC(u.uTop.value, [["#f4f7fa", 1], ["#c7d4e1", site], ["#86a8c9", day], ["#35577f", gold], ["#06101c", night]]);
    this.mixC(u.uHorizon.value, [["#f4f7fa", 1], ["#eef1f4", site], ["#ece5da", day], ["#f2ab6a", gold], ["#1f2c3e", night]]);
    this.mixC(u.uBottom.value, [["#f4f7fa", 1], ["#e3e6e8", site], ["#cfc8bc", day], ["#8a6a52", gold], ["#0b121c", night]]);
    u.uSun.value = gold * (1 - night);
    this.fog.color.copy(u.uHorizon.value);
    this.fog.near = lerp(80, 60, day);
    this.fog.far = lerp(320, 240, day);

    this.mixC(this.hemi.color, [["#ffffff", 1], ["#e9f0f7", site], ["#dfe8f2", day], ["#9fb4d1", gold], ["#3b4f70", night]]);
    this.mixC(this.hemi.groundColor, [["#e6ebf0", 1], ["#bdb6aa", site], ["#8d8a70", day], ["#6b5140", gold], ["#141820", night]]);
    const inside = seg(p, 0.64, 0.7) * (1 - seg(p, 0.89, 0.95));
    this.hemi.intensity = lerp(lerp(lerp(lerp(1.5, 1.25, site), 1.1, day), 0.62, inside), 0.55, gold) * (1 - night * 0.75);

    this.mixC(this.sun.color, [["#ffffff", 1], ["#fff6ea", day], ["#ffb26e", gold]]);
    this.sun.intensity = lerp(lerp(lerp(1.6, 2.7, day), 2.0, inside), 2.6, gold) * (1 - night);
    const sx = lerp(lerp(14, 22, day), 34, gold);
    const sy = lerp(lerp(30, 24, day), 8.5, gold);
    const sz = lerp(lerp(18, 20, day), 26, gold);
    this.sun.position.set(sx, sy, sz);
    u.uSunDir.value.set(sx, sy, sz).normalize();

    const interiorStage = seg(p, 0.6, 0.68) * (1 - seg(p, 0.88, 0.96));
    this.renderer.toneMappingExposure = lerp(lerp(1, 1.08, interiorStage), 1.05, gold) + night * 0.1;
    this.scene.environmentIntensity = lerp(0.55, 0.75, interiorStage) * (1 - night * 0.7);

    // Lawn rolls in, interior & lights come on
    this.lawn.material.opacity = smooth(seg(p, 0.5, 0.55));
    this.lawn.visible = this.lawn.material.opacity > 0.001;
    this.interior.visible = p > 0.47;
    const lightsIn = Math.max(seg(p, 0.56, 0.66), night);
    for (const l of this.interiorLights) l.intensity = lightsIn * lerp(lerp(lerp(6, 14, inside), 9, gold), 14, night);
    const lightsOut = Math.max(seg(p, 0.55, 0.62) * lerp(0.35, 1, gold), night);
    for (const e of this.emissives) {
      const k = e.kind === "exterior" ? lightsOut : e.kind === "fire" ? lightsIn : lightsIn * lerp(0.85, 1, gold);
      e.mat.emissiveIntensity = e.base * k;
    }
    this.glassGF.emissiveIntensity = (gold * 0.12 + night * 0.25) * (1 - interiorStage);
    this.glassUF.emissiveIntensity = gold * 0.4 + night * 0.9;
    this.glassUF.color.set(0x4f6372).lerp(this.col.set(0x8b6a4c), gold * 0.6 + night * 0.4);

    // Door swings open as the camera approaches
    const doorT = easeIO(seg(p, 0.612, 0.668));
    this.door.rotation.y = doorT * 1.75;

    // ── Camera ──
    const cam = this.camera;
    let fov: number;
    let shift: number;
    let ext: number;
    if (o.camera) {
      this.tmpV.set(...o.camera.pos);
      this.tmpT.set(...o.camera.tgt);
      fov = o.camera.fov;
      shift = o.shift ?? 0;
      ext = 1;
    } else {
      const n = KEYS.length;
      let i = 0;
      while (i < n - 2 && p > KEYS[i + 1].p) i++;
      const k0 = KEYS[i];
      const k1 = KEYS[i + 1];
      const lt = clamp01((p - k0.p) / (k1.p - k0.p));
      const st = lt * lt * (3 - 2 * lt) * 0.35 + lt * 0.65; // mild ease, keeps continuity
      const uu = (i + st) / (n - 1);
      this.posCurve.getPoint(uu, this.tmpV);
      this.tgtCurve.getPoint(uu, this.tmpT);
      fov = lerp(k0.fov, k1.fov, st);
      shift = lerp(k0.shift, k1.shift, st);
      ext = lerp(k0.ext, k1.ext, st);
    }
    // Portrait / narrow screens: keep the horizontal framing designed for 16:10.
    const aspect = this.width / this.height;
    const designAspect = 1.6;
    let vfov = fov;
    if (aspect < designAspect) {
      const tanH = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * designAspect;
      const needed = THREE.MathUtils.radToDeg(2 * Math.atan(tanH / aspect));
      const maxFov = lerp(64, 74, 1 - ext);
      vfov = Math.min(needed, maxFov);
      const dolly = Math.tan(THREE.MathUtils.degToRad(needed / 2)) / Math.tan(THREE.MathUtils.degToRad(vfov / 2));
      if (dolly > 1 && ext > 0) this.tmpV.sub(this.tmpT).multiplyScalar(1 + (dolly - 1) * ext * 0.85).add(this.tmpT);
      shift *= 0.15;
    }
    cam.position.copy(this.tmpV);
    cam.fov = vfov;
    cam.up.set(0, 1, 0);
    cam.lookAt(this.tmpT);
    if (Math.abs(shift) > 0.001) {
      cam.setViewOffset(this.width, this.height, -shift * this.width, 0, this.width, this.height);
    } else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }

  /** Project a world point to CSS pixels. Returns null if behind camera. */
  project(pos: [number, number, number], out: { x: number; y: number; vis: boolean }) {
    this.tmpV.set(...pos).project(this.camera);
    out.vis = this.tmpV.z < 1 && this.tmpV.z > -1;
    out.x = (this.tmpV.x * 0.5 + 0.5) * this.width;
    out.y = (-this.tmpV.y * 0.5 + 0.5) * this.height;
    return out;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}

export { L1, UF_TOP, WALL_T };
