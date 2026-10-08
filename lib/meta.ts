import type { Metadata } from "next";

export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | Reflex Interior & Construction`, description, url: path, images: ["/images/og.jpg"] },
  };
}
