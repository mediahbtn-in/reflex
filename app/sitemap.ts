import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "about/", "services/", "interior-design/", "construction/", "renovation/", "projects/", "contact/"].map((p) => ({
    url: `${SITE_URL}/${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
