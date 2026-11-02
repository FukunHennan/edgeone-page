import { languages, postsFor, projectsFor, postPath, type Language } from '../../lib/content';

/** Public, build-time JSON for the read-only site agent. Drafts are excluded by postsFor(). */
export function getStaticPaths() {
  return languages.map((lang) => ({ params: { lang } }));
}

export async function GET({ params }: { params: { lang?: string } }) {
  const lang = params.lang as Language;
  if (!languages.includes(lang)) return new Response('Not found', { status: 404 });
  const [posts, projects] = await Promise.all([postsFor(lang), projectsFor(lang)]);
  const articles = posts.map((post) => ({
    id: post.data.translation_key,
    kind: 'article',
    lang,
    title: post.data.title,
    description: post.data.description || '',
    tags: post.data.tags,
    url: postPath(post),
    // Bounded index size and model context; get_article supplies this excerpt.
    content: post.body.slice(0, 12000),
  }));
  const projectDocs = projects.map((project) => ({
    id: project.data.key,
    kind: 'project',
    lang,
    title: project.data.title,
    description: project.data.description,
    tags: project.data.tags,
    url: `/${lang}/projects/`,
    github: project.data.github,
    content: project.data.description,
  }));
  return new Response(JSON.stringify({ lang, generatedAt: new Date().toISOString(), docs: [...articles, ...projectDocs] }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
