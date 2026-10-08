# Reflex Interior & Construction — website

**Building Better Tomorrows.** A cinematic, scroll-driven site where the building is the main character:

`BLUEPRINT → FOUNDATION → STRUCTURE → ENCLOSURE → EXTERIOR → INTERIOR → DETAILS → COMPLETED HOME → services · projects · quote`

## Stack
- **Next.js (App Router, static export)**: every route is pre-rendered HTML for SEO (`/`, `/about`, `/services`, `/interior-design`, `/construction`, `/renovation`, `/projects`, `/contact`, plus `sitemap.xml` and `robots.txt`).
- **Three.js**: one procedural scene (`lib/scene/BuildScene.ts`) with no model files. Scroll progress `p ∈ [0,1]` drives every element, light and camera key, so scrolling backwards reverses the build exactly. The bundle is code-split and loads after first paint.
- **Lenis + GSAP ScrollTrigger**: smooth scrolling and section reveals.
- `lib/scene/plan.ts` is the single source of truth for the house. The blueprint sheet, the 3D wireframe and the physical building are all generated from it, so drawing and construction line up.

## Develop
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out — deploy to any CDN / static host
```

## Imagery
Portfolio, service, before/after and CTA images in `public/images` are WebP stills rendered from the same 3D model:
```bash
node scripts/render/render.mjs            # all shots
node scripts/render/render.mjs og proj-oak  # selected shots
```
(Needs Playwright + Chromium. Shot definitions live in `scripts/render/render.mjs`.)

## Before launch: replace placeholders
- **Logo**: `components/ui/Logo.tsx` and `public/brand/reflex-logo.svg` are a vector stand-in. Drop in the supplied Reflex logo.
- **Contact details & domain**: `lib/site.ts` (`email`, `phone`, `address`, `hours`) and set `NEXT_PUBLIC_SITE_URL`.
- **Portfolio**: `projects` in `lib/site.ts`. Names, locations and years are placeholders, and the images are renders. Swap in real project photography.
- **Contact form**: currently opens the visitor's email client (`app/contact/ContactForm.tsx`). Connect it to a form endpoint or CRM.

## Performance & accessibility
- Quality tiers by device (shadows, pixel ratio, tree count). The canvas renders only while the story is on screen.
- `prefers-reduced-motion`: no smooth scrolling. The story crossfades between eight still stage frames.
- No WebGL: the copy still runs as a scroll story over a CSS blueprint background.
