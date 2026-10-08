// Usage: node scripts/render/render.mjs   (needs a Chromium with WebGL; uses Playwright)
// Bundles entry.ts with esbuild, opens it headless and writes WebP stills to public/images.
import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(here, "../.render");
await mkdir(outDir, { recursive: true });
await build({ entryPoints: [path.join(here, "entry.ts")], bundle: true, outfile: path.join(outDir, "bundle.js"), format: "iife", target: "es2020", logLevel: "warning" });
await writeFile(path.join(outDir, "index.html"), await readFile(path.join(here, "index.html")));

const server = createServer(async (req, res) => {
  try {
    const f = path.join(outDir, req.url === "/" ? "index.html" : req.url);
    res.end(await readFile(f));
  } catch { res.statusCode = 404; res.end(); }
}).listen(4789);

const pw = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const chromium = pw.chromium ?? pw.default.chromium;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error(e));
await page.goto("http://localhost:4789/");
await page.waitForFunction(() => "renderShot" in window, null, { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);

const C = (pos, tgt, fov) => ({ camera: { pos, tgt, fov } });
const BA = C([12.5, 5.2, 15.5], [2.6, 1.2, 0.6], 42);
const shots = {
  "proj-horizon": { p: 1, w: 2100, h: 900, o: C([21, 4.2, 31], [1.5, 2.8, 0], 28) },
  "proj-oak": { p: 0.78, w: 1600, h: 1000, o: C([1.0, 1.45, 3.9], [6.2, 0.95, -0.6], 56) },
  "proj-kitchen": { p: 0.8, w: 1600, h: 1000, o: C([-0.4, 1.65, 1.2], [-4.2, 1.15, -3.2], 50) },
  "proj-cantilever": { p: 1, w: 1100, h: 1400, o: { ...C([18.5, 1.3, 8.5], [8.2, 4.4, 0], 46), night: 0.55 } },
  "proj-courtyard": { p: 1, w: 1600, h: 1000, o: C([12, 24, 21], [1.5, 0, 2.5], 36) },
  "proj-renewal": { p: 0.78, w: 1600, h: 1000, o: C([-4.6, 1.55, 3.2], [-7.4, 1.6, 0.6], 54) },
  "svc-architecture": { p: 0.015, w: 960, h: 720, o: C([2, 15, 9], [0.5, 0, 0], 44) },
  "svc-construction": { p: 0.36, w: 960, h: 720, o: C([17, 5.5, 14], [1, 2.6, 0], 40) },
  "svc-interior": { p: 0.78, w: 960, h: 720, o: C([4.5, 1.5, 3.8], [0.5, 1.1, -3.4], 54) },
  "svc-renovation": { p: 0.47, w: 960, h: 720, o: C([-13, 3.5, 15], [0, 2.4, 1], 40) },
  "svc-turnkey": { p: 0.6, w: 960, h: 720, o: C([-9, 2.4, 18], [-1, 2.4, 2], 42) },
  "svc-transformation": { p: 0.125, w: 960, h: 720, o: C([13, 8, 17], [1, 2, 0], 40) },
  "ba-1-blueprint": { p: 0.012, w: 1600, h: 900, o: BA },
  "ba-2-design": { p: 0.13, w: 1600, h: 900, o: BA },
  "ba-3-construction": { p: 0.43, w: 1600, h: 900, o: BA },
  "ba-4-final": { p: 0.995, w: 1600, h: 900, o: BA },
  "final-night": { p: 1, w: 1920, h: 1080, o: { ...C([19, 3.6, 27], [2.5, 3.0, 0], 34), night: 1 } },
  "og": { p: 1, w: 1200, h: 630, o: C([19, 4.6, 28], [1.5, 2.7, 0], 32), type: "image/jpeg", q: 0.86 },
  "page-hero": { p: 1, w: 1920, h: 1080, o: { ...C([-15, 2.2, 21], [0, 2.8, 1], 36), night: 0.25 } },
};

const only = process.argv.slice(2);
for (const [name, s] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue;
  const t = Date.now();
  const data = await page.evaluate((s) => window.renderShot(s), s);
  const ext = s.type === "image/jpeg" ? "jpg" : "webp";
  const buf = Buffer.from(data.split(",")[1], "base64");
  await writeFile(path.join(root, "public/images", `${name}.${ext}`), buf);
  console.log(`${name}.${ext}  ${(buf.length / 1024).toFixed(0)} KB  ${Date.now() - t} ms`);
}
await browser.close();
server.close();
