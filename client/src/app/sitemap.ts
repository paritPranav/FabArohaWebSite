// client/src/app/sitemap.ts
// Next.js built-in sitemap — auto-served at /sitemap.xml
// Revalidated every 24 h via ISR; also force-refreshed by the server cron job.
import type { MetadataRoute } from 'next';

export const revalidate = 86400; // 24 hours

const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:4000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fabaroha.com';

type ChangeFreq = MetadataRoute.Sitemap[number]['changeFrequency'];

interface StaticPage { path: string; priority: number; changefreq: string }
interface SlugEntry  { slug: string; updatedAt: string }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_URL}/sitemap/data`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { products, collections, staticPages } = await res.json() as {
      products:    SlugEntry[];
      collections: SlugEntry[];
      staticPages: StaticPage[];
    };

    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = staticPages.map(p => ({
      url:             `${SITE_URL}${p.path}`,
      lastModified:    now,
      changeFrequency: p.changefreq as ChangeFreq,
      priority:        p.priority,
    }));

    // One entry per product SKU / slug
    const productEntries: MetadataRoute.Sitemap = products.map(p => ({
      url:             `${SITE_URL}/products/${p.slug}`,
      lastModified:    new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }));

    const collectionEntries: MetadataRoute.Sitemap = collections.map(c => ({
      url:             `${SITE_URL}/collections/${c.slug}`,
      lastModified:    new Date(c.updatedAt),
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    }));

    return [...staticEntries, ...productEntries, ...collectionEntries];
  } catch (err) {
    console.error('[sitemap] Generation failed:', err);
    // Minimal fallback so Google doesn't get a 500
    return [{ url: SITE_URL, lastModified: new Date(), priority: 1.0 }];
  }
}
