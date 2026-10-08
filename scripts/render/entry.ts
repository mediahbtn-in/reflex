// Offline still renderer: draws frames of the same 3D model used on the homepage,
// so portfolio/service/before-after imagery matches the story exactly.
import { BuildScene, type SceneOverrides } from "../../lib/scene/BuildScene";

type Shot = { p: number; w: number; h: number; o?: SceneOverrides; type?: string; q?: number };

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const scene = new BuildScene(canvas, { quality: "high", fontMono: "'IBM Plex Mono', monospace", fontSans: "Manrope, sans-serif", preserve: true });

(window as unknown as { renderShot: (s: Shot) => string }).renderShot = (s: Shot) => {
  scene.resize(s.w, s.h, 1);
  // two updates: the first settles visibility, the second the camera
  scene.update(s.p, 12, 1, s.o ?? {});
  scene.update(s.p, 12, 1, s.o ?? {});
  scene.render();
  return canvas.toDataURL(s.type ?? "image/webp", s.q ?? 0.84);
};
