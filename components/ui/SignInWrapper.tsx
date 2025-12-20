'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FloatingPaths } from '@/components/ui/FloatingPaths';
import Logo from '@/components/icons/Logo';

interface SignInWrapperProps {
  children: React.ReactNode;
}

export default function SignInWrapper({ children }: SignInWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState<{title: string, description: string} | null>(null);

  // Gérer les messages de statut depuis l'URL
  useEffect(() => {
    const status = searchParams.get('status');
    const statusDescription = searchParams.get('status_description');

    if (status && statusDescription) {
      setStatusMessage({
        title: status,
        description: statusDescription
      });

      // Nettoyer l'URL après avoir affiché le message
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('status');
      newSearchParams.delete('status_description');

      const newUrl = pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return (
    <div className="relative h-[700px] md:overflow-hidden lg:grid lg:grid-cols-2 max-w-screen-xl mx-auto mt-[60px] mb-[120px]">
      <div className="relative hidden h-full flex-col border-r bg-oceanblue p-10 lg:flex rounded-xl">
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;This Platform has helped me to save time and serve my
              clients faster than ever before.&rdquo;
            </p>
            <footer className="font-mono font-semibold text-sm">
              ~ Dragonfly User
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
      <div className="relative flex flex-col justify-center p-4">
        <div
          aria-hidden
          className="-z-10 absolute inset-0 isolate opacity-60 contain-strict"
        >
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <div className="mx-auto space-y-4 sm:w-sm">
          <Logo className="h-5 lg:hidden" />

          {/* Status message banner */}
          {statusMessage && (
            <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-md mb-4">
              <div className="flex items-center gap-3">
                <div className="text-lg">ℹ️</div>
                <div>
                  <div className="font-medium">{statusMessage.title}</div>
                  <div className="text-sm">{statusMessage.description}</div>
                </div>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
