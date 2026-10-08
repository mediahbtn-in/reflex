/** @type {import('next').NextConfig} */
const nextConfig = {
  // On Vercel the app deploys as a regular Next.js app (every page is still
  // pre-rendered at build time). For any other static host run
  // `npm run build:static`, which writes a fully static site to ./out.
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export", images: { unoptimized: true } } : {}),
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
};

export default nextConfig;
