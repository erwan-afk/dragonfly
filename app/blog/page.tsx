import Link from 'next/link';
import { getPublishedPosts } from '@/utils/blog-data';
import { getURL } from '@/utils/helpers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog: Dragonfly Trimaran Guides, Prices & Buying Advice',
  description:
    'Guides for buying and selling boats: Dragonfly trimaran prices, used boat checklists, trimaran vs catamaran, transport and more.',
  alternates: { canonical: getURL('/blog') }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

export default function BlogIndexPage() {
  const posts = [...getPublishedPosts()].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
  return (
    <div className="max-w-screen-xl mx-auto px-16 xl:px-0 py-[40px] lg:py-[80px]">
      <div className="flex flex-col gap-16 mb-48">
        <h1 className="text-oceanblue text-32 lg:text-40 font-medium">
          The <span className="text-articblue">3Hulls</span> Blog
        </h1>
        <p className="text-darkgrey text-16 max-w-2xl">
          Practical guides for buying, selling and understanding Dragonfly
          trimarans and other boats.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-8 border border-stonegrey/30 hover:border-articblue/60 rounded-xl p-24 transition-colors duration-300"
          >
            <p className="text-stonegrey text-[11px] uppercase tracking-wider">
              {formatDate(post.publishedAt)} · {post.readingMinutes} min read
            </p>
            <h2 className="text-oceanblue text-20 font-medium group-hover:text-articblue transition-colors">
              {post.title}
            </h2>
            <p className="text-darkgrey text-[13px]">{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
