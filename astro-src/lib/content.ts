import { getCollection, type CollectionEntry } from 'astro:content';
// 单语站点：仅中文（zh-CN）。
export const languages = ['zh-CN'] as const;
export type Language = typeof languages[number];
export type Post = CollectionEntry<'postsZh'>;
export function postPath(post: Post): string {
  const path = post.data.permalink || `posts/${post.data.slug || post.id}`;
  return `/${post.data.lang}/${path.replace(/^\/+|\/+$/g, '')}/`;
}
export async function postsFor(_lang: Language) {
  const posts = await getCollection('postsZh');
  return posts.filter((post) => post.data.published && !post.data.draft && post.data.date <= new Date())
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export async function projectsFor(_lang: Language) {
  const items = await getCollection('projectsZh');
  return items.sort((a, b) => a.data.order - b.data.order);
}

export type TaxonomyKind = 'tags' | 'categories';
export function archiveFilterPath(lang: Language, kind: TaxonomyKind, name: string) {
  const key = kind === 'categories' ? 'category' : 'tag';
  return `/${lang}/archives/?${key}=${encodeURIComponent(termSlug(name))}`;
}
// 统一的领域分类标签（英文枚举 -> 各语言显示名）。项目列表与文章归档共用。
const DOMAIN_LABELS: Record<string, { 'zh-CN': string; en: string }> = {
  embedded: { 'zh-CN': '嵌入式', en: 'Embedded' },
  server: { 'zh-CN': '服务器', en: 'Server' },
  software: { 'zh-CN': '软件', en: 'Software' },
  research: { 'zh-CN': '研究', en: 'Research' },
  web: { 'zh-CN': '网站', en: 'Web' },
};
export function domainLabel(name: string, lang: Language): string {
  return DOMAIN_LABELS[name]?.[lang] ?? name;
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
