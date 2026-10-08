/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export: every route (/, /about, /services, …) is pre-rendered
  // to HTML for fast first paint and SEO. Deploy the `out/` folder to any CDN.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
};

export default nextConfig;
