import { getCollection, type CollectionEntry } from 'astro:content';
export const languages = ['zh-CN', 'en'] as const;
export type Language = typeof languages[number];
export type Post = CollectionEntry<'postsZh'> | CollectionEntry<'postsEn'>;
export function postPath(post: Post): string {
  const path = post.data.permalink || `posts/${post.data.slug || post.id}`;
  return `/${post.data.lang}/${path.replace(/^\/+|\/+$/g, '')}/`;
}
export async function postsFor(lang: Language) {
  const posts = lang === 'zh-CN' ? await getCollection('postsZh') : await getCollection('postsEn');
  return posts.filter((post) => post.data.published && !post.data.draft && post.data.date <= new Date())
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export async function projectsFor(lang: Language) {
  const items = lang === 'zh-CN' ? await getCollection('projectsZh') : await getCollection('projectsEn');
  return items.sort((a, b) => a.data.order - b.data.order);
}

export type TaxonomyKind = 'tags' | 'categories';
export function archiveFilterPath(lang: Language, kind: TaxonomyKind, name: string) {
  const key = kind === 'categories' ? 'category' : 'tag';
  return `/${lang}/archives/?${key}=${encodeURIComponent(termSlug(name))}`;
}
export function termSlug(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}
export async function taxonomyFor(lang: Language, kind: TaxonomyKind) {
  const terms = new Map<string, { name: string; posts: Post[] }>();
  for (const post of await postsFor(lang)) {
    for (const name of post.data[kind]) {
      const slug = termSlug(name);
      if (!slug) throw new Error(`Empty ${kind} slug: ${name}`);
      const existing = terms.get(slug);
      if (existing && existing.name !== name) throw new Error(`Colliding ${kind} slug: ${name} / ${existing.name}`);
      if (existing) existing.posts.push(post);
      else terms.set(slug, { name, posts: [post] });
    }
  }
  return [...terms].map(([slug, value]) => ({ slug, ...value }))
    .sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name, lang));
}
