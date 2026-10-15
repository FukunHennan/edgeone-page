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
