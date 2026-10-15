import type { APIRoute } from 'astro';
import { languages, postsFor, postPath, type Language } from '../../lib/content';
export function getStaticPaths() { return languages.map((lang) => ({ params: { lang } })); }
export const GET: APIRoute = async ({ params }) => new Response(JSON.stringify((await postsFor(params.lang as Language)).map((post) => ({ title: post.data.title, description: post.data.description || '', url: postPath(post) }))), { headers: { 'Content-Type': 'application/json' } });
