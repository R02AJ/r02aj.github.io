import type { CollectionEntry } from 'astro:content';
import { withBase } from '../data/site';

export function sortByOrder<T extends { data: { order: number } }>(a: T, b: T): number {
  return a.data.order - b.data.order;
}

export function entrySlug(id: string): string {
  return id.replace(/\.(md|mdx)$/i, '').replace(/\/index$/i, '');
}

export function projectHref(entry: CollectionEntry<'projects'>): string {
  return withBase(`/research/${entrySlug(entry.id)}`);
}

export function summaryProjectSlug(entry: CollectionEntry<'summaries'>): string {
  return entry.data.projectSlug || entrySlug(entry.id);
}

export function summaryHref(entry: CollectionEntry<'summaries'>): string {
  return withBase(`/research/${summaryProjectSlug(entry)}/summary`);
}

export function readableAssetLabel(asset: string): string {
  return asset
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
