import Link from 'next/link';
import { notFound } from 'next/navigation';
import BackLink from '@/components/ui/BackLink/BackLink';
import BlogText from '@/components/ui/BlogText/BlogText';
import Button from '@/components/ui/Button/Button';
import {
  CLUSTER_LABELS,
  CLUSTER_PILLARS,
  getBlogPost,
  getPublishedPosts,
  getRelatedPosts
} from '@/utils/blog-data';
import { getURL } from '@/utils/helpers';
import { buildBreadcrumbJsonLd } from '@/utils/json-ld';

interface BlogPostPageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: BlogPostPageProps) {
  const post = getBlogPost(params.slug);
  if (!post) {
    return { title: 'Article not found', robots: { index: false, follow: true } };
  }
  const url = getURL(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.publishedAt
    }
  };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const url = getURL(`/blog/${post.slug}`);
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: '3Hulls' },
    publisher: { '@type': 'Organization', name: '3Hulls' }
  };
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: getURL('/') },
    { name: 'Blog', url: getURL('/blog') },
    { name: post.title, url }
  ]);
  const related = getRelatedPosts(post);
  const isPillar = CLUSTER_PILLARS[post.cluster] === post.slug;

  return (
    <div className="max-w-screen-xl mx-auto px-16 xl:px-0 py-[40px] lg:py-[60px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="max-w-3xl flex flex-col gap-32">
        <div className="flex flex-col gap-16">
          <BackLink
            fallbackHref="/blog"
            fallbackLabel="All articles"
            className="text-stonegrey hover:text-articblue text-14 w-fit"
          />
          <h1 className="text-oceanblue text-32 lg:text-40 font-medium">
            {post.title}
          </h1>
          <p className="text-stonegrey text-12 uppercase tracking-wider">
            {formatDate(post.publishedAt)} · {post.readingMinutes} min read
          </p>
          <p className="text-darkgrey text-18">{post.intro}</p>
        </div>

        {post.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-12">
            <h2 className="text-oceanblue text-24 font-medium">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-darkgrey text-16 leading-relaxed">
                <BlogText text={p} />
              </p>
            ))}
            {section.bullets && (
              <ul className="list-disc pl-24 flex flex-col gap-8 text-darkgrey text-16 leading-relaxed">
                {section.bullets.map((b, i) => (
                  <li key={i}>
                    <BlogText text={b} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="flex flex-col sm:flex-row gap-16 border-t border-stonegrey/30 pt-32">
          <Button text="Browse boats for sale" href="/forsale" icon="view" />
          <Button text="Place an ad" href="/list-boat" icon="add" />
        </div>
      </article>

      <section
        aria-label="Related articles"
        className={related.length > 0 ? 'mt-64 flex flex-col gap-16' : 'hidden'}
      >
        <h2 className="text-oceanblue text-24 font-medium">
          {isPillar
            ? `All guides in this topic: ${CLUSTER_LABELS[post.cluster]}`
            : `More in ${CLUSTER_LABELS[post.cluster]}`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          {related.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group border border-stonegrey/30 hover:border-articblue/60 rounded-xl p-24 transition-colors"
            >
              <h3 className="text-oceanblue text-18 font-medium group-hover:text-articblue transition-colors">
                {p.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
