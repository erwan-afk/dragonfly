'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  boatId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  /** Button diameter in px — icon and burst scale with it. Defaults to the detail-page size. */
  size?: number;
  className?: string;
}

const PARTICLE_COUNT = 8;
const PARTICLE_COLORS = ['#e05252', '#ff8a8a', '#ffb648', '#2c8a82'];

export function FavoriteButton({
  boatId,
  initialFavorited,
  isAuthenticated,
  size = 40,
  className = ''
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);
  const [burstId, setBurstId] = useState<number | null>(null);

  useEffect(() => {
    if (burstId === null) return;
    const timeout = setTimeout(() => setBurstId(null), 650);
    return () => clearTimeout(timeout);
  }, [burstId]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      // Cards wrap this button in a <Link> to the listing — never navigate on a heart click.
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        router.push(`/signin?callbackUrl=${encodeURIComponent(pathname || '/')}`);
        return;
      }
      if (pending) return;
      setPending(true);
      const next = !favorited;
      setFavorited(next);
      if (next) setBurstId(Date.now());
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boatId })
        });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setFavorited(!!data.favorited);
      } catch {
        setFavorited(!next);
      } finally {
        setPending(false);
      }
    },
    [isAuthenticated, pending, favorited, boatId, pathname, router]
  );

  const iconSize = Math.round(size * 0.45);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={favorited}
      disabled={pending}
      style={{ width: size, height: size }}
      className={`relative overflow-visible rounded-full border border-[#dde3e7] bg-fullwhite flex items-center justify-center text-[#3a4a52] hover:bg-[#f7f9fa] transition-colors ${className}`}
    >
      <motion.span
        key={favorited ? 'filled' : 'empty'}
        initial={{ scale: 0.55, rotate: favorited ? -15 : 0 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 550, damping: 14 }}
        className="flex items-center justify-center"
      >
        <Heart
          size={iconSize}
          strokeWidth={2}
          fill={favorited ? '#e05252' : 'none'}
          stroke={favorited ? '#e05252' : 'currentColor'}
        />
      </motion.span>

      <AnimatePresence>{burstId !== null && <HeartBurst key={burstId} radius={size * 0.6} />}</AnimatePresence>
    </button>
  );
}

function HeartBurst({ radius }: { radius: number }) {
  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              scale: 0.3
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 w-[6px] h-[6px] rounded-full pointer-events-none"
            style={{ marginLeft: -3, marginTop: -3, backgroundColor: color }}
          />
        );
      })}
      <motion.span
        initial={{ opacity: 0.5, scale: 0.4 }}
        animate={{ opacity: 0, scale: 2.2 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full border-2 border-[#e05252] pointer-events-none"
      />
    </>
  );
}
