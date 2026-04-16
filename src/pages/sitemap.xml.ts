import { getCollection } from 'astro:content';
import { entrySlug, sortByOrder, summaryProjectSlug } from '../utils/content';
import { toAbsoluteUrl } from '../data/site';

export const prerender = true;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function urlNode(pathname: string, lastmod: string): string {
  const normalizedPath =
    pathname === '/' || pathname.endsWith('/') ? pathname : `${pathname}/`;

  return [
    '<url>',
    `<loc>${escapeXml(toAbsoluteUrl(normalizedPath))}</loc>`,
    `<lastmod>${lastmod}</lastmod>`,
    '</url>'
  ].join('');
}

export async function GET() {
  const today = new Date().toISOString();

  const projects = (await getCollection('projects')).sort(sortByOrder);
  const summaries = (await getCollection('summaries')).sort(sortByOrder);

  const staticRoutes = ['/', '/research', '/cv', '/about'];
  const dynamicResearchRoutes = projects
    .filter((project) => project.data.status === 'Research')
    .map((project) => `/research/${entrySlug(project.id)}`);
  const dynamicSummaryRoutes = summaries.map(
    (summary) => `/research/${summaryProjectSlug(summary)}/summary`
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...staticRoutes, ...dynamicResearchRoutes, ...dynamicSummaryRoutes].map((route) =>
      urlNode(route, today)
    ),
    '</urlset>'
  ].join('');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
