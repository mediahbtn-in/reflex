// Central place for brand + contact details.
// TODO(client): replace the placeholder contact details and SITE_URL before launch.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

export const site = {
  name: "Reflex Interior & Construction",
  shortName: "Reflex",
  tagline: "Building Better Tomorrows",
  title: "Reflex Interior & Construction | Building Better Tomorrows",
  description:
    "Reflex Interior and Construction creates thoughtfully designed interiors and professionally executed construction projects, transforming visions into beautiful spaces.",
  email: "hello@example.com",
  phone: "+00 00000 00000",
  address: "Studio address — City, Country",
  hours: "Mon – Sat · 09:30 – 18:30",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about/" },
  { label: "Services", href: "/services/" },
  { label: "Projects", href: "/projects/" },
  { label: "Process", href: "/#process" },
  { label: "Contact", href: "/contact/" },
];

export const stages = [
  { n: "01", key: "vision", title: "The Vision" },
  { n: "02", key: "foundation", title: "The Foundation" },
  { n: "03", key: "structure", title: "The Structure" },
  { n: "04", key: "enclosure", title: "The Enclosure" },
  { n: "05", key: "exterior", title: "The Exterior" },
  { n: "06", key: "interior", title: "The Interior" },
  { n: "07", key: "details", title: "The Details" },
  { n: "08", key: "completed", title: "Completed" },
] as const;

export type Service = {
  n: string;
  slug: string;
  title: string;
  short: string;
  href: string;
  image: string;
  icon: "architecture" | "construction" | "interior" | "renovation" | "turnkey" | "transformation";
};

export const services: Service[] = [
  {
    n: "01",
    slug: "architecture",
    title: "Architecture",
    short: "Concept, planning and detailed drawings that turn a brief into a buildable, beautiful design.",
    href: "/services/#architecture",
    image: "/images/svc-architecture.webp",
    icon: "architecture",
  },
  {
    n: "02",
    slug: "construction",
    title: "Construction",
    short: "Foundations to finishes — engineered structure, disciplined sites and on-time delivery.",
    href: "/construction/",
    image: "/images/svc-construction.webp",
    icon: "construction",
  },
  {
    n: "03",
    slug: "interior-design",
    title: "Interior Design",
    short: "Warm, considered interiors where light, material and joinery work as one.",
    href: "/interior-design/",
    image: "/images/svc-interior.webp",
    icon: "interior",
  },
  {
    n: "04",
    slug: "renovation",
    title: "Renovation",
    short: "Careful upgrades that respect what exists and unlock what a space could be.",
    href: "/renovation/",
    image: "/images/svc-renovation.webp",
    icon: "renovation",
  },
  {
    n: "05",
    slug: "turnkey",
    title: "Turnkey Projects",
    short: "One team, one contract, one point of contact — from first sketch to handover keys.",
    href: "/services/#turnkey",
    image: "/images/svc-turnkey.webp",
    icon: "turnkey",
  },
  {
    n: "06",
    slug: "transformation",
    title: "Space Transformation",
    short: "Re-planning layouts and re-imagining spaces for the way you live and work today.",
    href: "/services/#transformation",
    image: "/images/svc-transformation.webp",
    icon: "transformation",
  },
];

// TODO(client): placeholder portfolio — replace names, places, years and imagery with real projects.
export type Project = {
  name: string;
  location: string;
  category: "Residential" | "Interiors" | "Commercial" | "Renovation" | "Turnkey";
  year: string;
  image: string;
  size?: "wide" | "tall" | "std";
};

export const projects: Project[] = [
  { name: "The Horizon Residence", location: "Hillside", category: "Residential", year: "2026", image: "/images/proj-horizon.webp", size: "wide" },
  { name: "Oak & Stone Living", location: "City Centre", category: "Interiors", year: "2025", image: "/images/proj-oak.webp", size: "std" },
  { name: "Atelier Kitchen", location: "Garden District", category: "Turnkey", year: "2025", image: "/images/proj-kitchen.webp", size: "std" },
  { name: "Cantilever House", location: "Lakeside", category: "Residential", year: "2024", image: "/images/proj-cantilever.webp", size: "tall" },
  { name: "Courtyard Offices", location: "Business Park", category: "Commercial", year: "2024", image: "/images/proj-courtyard.webp", size: "std" },
  { name: "Heritage Renewal", location: "Old Town", category: "Renovation", year: "2023", image: "/images/proj-renewal.webp", size: "std" },
];
