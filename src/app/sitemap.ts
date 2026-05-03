import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kavvo.store';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/servicios', '/barberos', '/nosotros', '/contacto', '/privacy', '/login', '/register'];

  return routes.map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
