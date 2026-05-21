import { ReactNode } from 'react';

export interface LegalSection {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  sections?: LegalSection[];
  intro?: ReactNode;
  children: ReactNode;
}

export default function LegalLayout({
  title,
  lastUpdated,
  sections,
  intro,
  children
}: LegalLayoutProps) {
  return (
    <div className="w-full flex flex-col">
      <section className="w-full pb-[128px] bg-fullwhite">
        <div className="mx-auto max-w-screen-xl w-full flex flex-col gap-32 lg:gap-[56px] px-16 xl:px-0">
          <header className="flex flex-col gap-8">
            <h1 className="text-articblue text-32 lg:text-56">{title}</h1>
            <p className="text-darkgrey text-14">
              Last updated: {lastUpdated}
            </p>
          </header>

          {intro && (
            <div className="text-oceanblue text-16 lg:text-18 leading-relaxed max-w-3xl">
              {intro}
            </div>
          )}

          {sections && sections.length > 0 && (
            <nav
              aria-label="Table of contents"
              className="rounded-12 border border-stonegrey/20 bg-lightgrey/40 p-16 lg:p-24 max-w-3xl"
            >
              <div className="text-oceanblue font-medium mb-12">Contents</div>
              <ol className="flex flex-col gap-4 list-decimal list-inside text-articblue text-14">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="hover:underline">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="w-full text-oceanblue text-16 lg:text-18 leading-relaxed max-w-3xl flex flex-col gap-32 [&_h2]:text-articblue [&_h2]:text-24 [&_h2]:lg:text-32 [&_h2]:font-medium [&_h2]:scroll-mt-24 [&_h3]:text-oceanblue [&_h3]:text-18 [&_h3]:lg:text-20 [&_h3]:font-medium [&_p]:my-8 [&_ul]:list-disc [&_ul]:pl-20 [&_ul]:my-8 [&_ol]:list-decimal [&_ol]:pl-20 [&_ol]:my-8 [&_a]:text-articblue [&_a]:underline [&_a:hover]:text-oceanblue [&_strong]:font-medium">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}

export function Section({
  id,
  title,
  children
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-8">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block px-6 py-1 rounded bg-yellow-100 text-yellow-900 text-13 font-mono border border-yellow-300">
      [{children}]
    </span>
  );
}
