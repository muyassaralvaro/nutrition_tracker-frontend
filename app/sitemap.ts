import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/terms", "/privacy"].map((path) => ({ url: `https://nourish.my.id${path}` }));
}
