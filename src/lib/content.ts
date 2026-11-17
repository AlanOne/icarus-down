// Astro-only: loads the content collections into the plain types the date logic uses.
import { getCollection } from 'astro:content';
import type { Release } from './releases';
import type { Show } from './shows';

export async function loadShows(): Promise<Show[]> {
  return (await getCollection('shows')).map((e) => ({ slug: e.id, ...e.data }));
}

export async function loadReleases(): Promise<Release[]> {
  return (await getCollection('releases')).map((e) => ({ slug: e.id, ...e.data }));
}

export async function loadVideos() {
  return (await getCollection('videos'))
    .map((e) => ({ slug: e.id, ...e.data }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadMembers() {
  return (await getCollection('members'))
    .map((e) => ({ slug: e.id, ...e.data }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function loadMerch() {
  return (await getCollection('merch'))
    .map((e) => ({ slug: e.id, ...e.data }))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name));
}

export type Member = Awaited<ReturnType<typeof loadMembers>>[number];
export type MerchItem = Awaited<ReturnType<typeof loadMerch>>[number];
export type Video = Awaited<ReturnType<typeof loadVideos>>[number];
