import { createRequire } from 'node:module';
import * as compatibilityRegistry from '../../tools/astro-registries.mjs';
import hero from '../../themes/edg-one-page/layout/pages/home/home-banner.ejs?raw';
import dashboard from '../../themes/edg-one-page/layout/pages/home/home-content.ejs?raw';
import navbar from '../../themes/edg-one-page/layout/components/header/navbar.ejs?raw';
import { postPath, type Post, type Language } from './content';
const require = createRequire(import.meta.url);
const ejs = require('ejs') as { render: (template: string, data: Record<string, unknown>) => string };
const registry = compatibilityRegistry as { renderProjects: (language: string, items: unknown[]) => string };
export function themePartial(part: 'hero' | 'dashboard' | 'navbar', lang: Language, pathname: string, posts: Post[] = [], alternatePath?: string, activeSection?: 'projects') {
  return ejs.render({ hero, dashboard, navbar }[part], {
    alternatePath,
    config: { language: lang, root: `/${lang}/` },
    page: { posts: posts.map((post) => ({ ...post.data, path: postPath(post), tags: { length: post.data.tags.length, data: post.data.tags.map((name) => ({ name })) } })) },
    is_home: () => pathname === `/${lang}/`, is_current: (path: string) => activeSection ? path === `/${activeSection}/` : pathname.startsWith(`/${lang}${path}`),
    url_for: (path: string) => path.startsWith(`/${lang}/`) ? path : path.startsWith('/images/') ? `/theme${path}` : `/${lang}/${path.replace(/^\//, '')}`,
    date: (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value),
  });
}
export function registryMarkup(lang: Language, items: unknown[]) {
  return registry.renderProjects(lang, items).replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace('<main class="workspace-content">', '<div class="workspace-content">').replace('</main>', '</div>');
}
