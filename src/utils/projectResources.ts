import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CollectionEntry } from 'astro:content';
import { isPlaceholderLink, siteConfig, withBase } from '../data/site';
import { entrySlug } from './content';

export type ProjectCardResourceLink = {
  label: 'Paper PDF' | 'Zenodo' | 'arXiv';
  href: string;
  external?: boolean;
};

function isExternalHref(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

function validateLocalHref(label: string, href: string): void {
  if (!href.startsWith('/')) {
    return;
  }

  const filePath = join(process.cwd(), 'public', href.replace(/^\/+/, ''));
  if (!existsSync(filePath)) {
    throw new Error(`Missing project-card resource target for ${label}: ${href}`);
  }
}

function requiredHref(label: string, href?: string): string {
  if (!href || isPlaceholderLink(href)) {
    throw new Error(`Missing project-card resource target for ${label}`);
  }

  validateLocalHref(label, href);
  return withBase(href);
}

function findProjectLink(project: CollectionEntry<'projects'>, keywords: string[]): string | undefined {
  for (const link of project.data.externalLinks) {
    const label = link.label.toLowerCase();
    const href = link.href.toLowerCase();

    if (keywords.some((keyword) => label.includes(keyword) || href.includes(keyword))) {
      return link.href;
    }
  }

  return undefined;
}

export function projectCardResourceLinks(
  project: CollectionEntry<'projects'>
): ProjectCardResourceLink[] {
  const slug = entrySlug(project.id);

  if (slug === 'hamjepa') {
    const paperPdfHref = requiredHref(
      'HamJEPA Paper PDF',
      findProjectLink(project, ['paper']) ?? siteConfig.links.hamjepaPaper
    );
    const zenodoHref = requiredHref('HamJEPA Zenodo', siteConfig.links.zenodo);

    return [
      { label: 'Paper PDF', href: paperPdfHref, external: true },
      { label: 'Zenodo', href: zenodoHref, external: true }
    ];
  }

  if (slug === 'chebyshev-option-surfaces') {
    const paperPdfHref = requiredHref('Chebyshev Paper PDF', siteConfig.links.chebyshevPaperPdf);
    const arxivHref = requiredHref(
      'Chebyshev arXiv',
      findProjectLink(project, ['arxiv']) ?? siteConfig.links.chebyshevPaper
    );

    return [
      { label: 'Paper PDF', href: paperPdfHref, external: true },
      { label: 'arXiv', href: arxivHref, external: isExternalHref(arxivHref) }
    ];
  }

  return [];
}
