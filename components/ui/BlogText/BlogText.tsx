import Link from 'next/link';
import { Fragment } from 'react';
import { getPublishedPosts } from '@/utils/blog-data';

// Renders inline [text](/path) links and **bold** from plain strings.
const TOKEN = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;

export default function BlogText({ text }: { text: string }) {
  const published = new Set(getPublishedPosts().map((p) => p.slug));
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link && /^https?:\/\//.test(link[2])) {
          return (
            <a
              key={i}
              href={link[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-articblue underline underline-offset-2 hover:text-oceanblue transition-colors"
            >
              {link[1]}
            </a>
          );
        }
        // Links to posts not published yet render as plain text (no dead links).
        if (link && link[2].startsWith('/blog/') && !published.has(link[2].slice(6))) {
          return <Fragment key={i}>{link[1]}</Fragment>;
        }
        if (link) {
          return (
            <Link
              key={i}
              href={link[2]}
              className="text-articblue underline underline-offset-2 hover:text-oceanblue transition-colors"
            >
              {link[1]}
            </Link>
          );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) {
          return (
            <strong key={i} className="font-medium text-oceanblue">
              {bold[1]}
            </strong>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
