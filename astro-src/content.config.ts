import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';
import yaml from 'js-yaml';

// 统一的领域分类体系。项目列表（data/*/projects.yml 的 category）与文章归档
// （source/*/_posts 的 categories）共用同一套领域标识，保证两处口径一致。
export const DOMAINS = ['embedded', 'server', 'software', 'research', 'web'] as const;
export type Domain = (typeof DOMAINS)[number];
const domainSchema = z.enum(DOMAINS);

const postSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  cover: z.string().optional(),
  lang: z.enum(['zh-CN', 'en']),
  translation_key: z.string(),
  content_type: z.enum(['article', 'showcase', 'interactive']),
  domain: domainSchema,
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(domainSchema).default([]),
  published: z.boolean().default(true),
  draft: z.boolean().default(false),
  slug: z.string().optional(),
  permalink: z.string().optional(),
});
const projectSchema = z.object({
  order: z.number().default(0),
  key: z.string(),
  status: z.string(),
  category: z.array(domainSchema),
  label: z.string(),
  title: z.string(),
  description: z.string(),
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  github: z.url(),
  post: z.string(),
});
const posts = (lang: 'zh-CN' | 'en') => defineCollection({
  loader: glob({ pattern: '**/*.md', base: `./source/${lang}/_posts`,
    generateId: ({ entry }) => entry.replace(/\.md$/i, '') }),
  schema: postSchema.extend({ lang: z.literal(lang) }),
});
const projects = (lang: 'zh-CN' | 'en') => defineCollection({
  loader: file(`./data/${lang}/projects.yml`, {
    parser: (text) => {
      const rows = z.array(projectSchema).parse(yaml.load(text));
      if (new Set(rows.map((row) => row.key)).size !== rows.length) {
        throw new Error(`Duplicate project key in ${lang}`);
      }
      return rows.map((row, order) => ({ ...row, order, id: row.key }));
    },
  }),
  schema: projectSchema,
});
export const collections = {
  pagesZh: defineCollection({ loader: glob({ pattern: '**/index.md', base: './source/zh-CN', generateId: ({ entry }) => entry.replace(/\/index\.md$/, '') }), schema: z.object({ title: z.string(), registry: z.string().optional() }) }),
  pagesEn: defineCollection({ loader: glob({ pattern: '**/index.md', base: './source/en', generateId: ({ entry }) => entry.replace(/\/index\.md$/, '') }), schema: z.object({ title: z.string(), registry: z.string().optional() }) }),
  postsZh: posts('zh-CN'), postsEn: posts('en'),
  projectsZh: projects('zh-CN'), projectsEn: projects('en'),
};
