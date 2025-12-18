'use client';

import { useSession } from '@/lib/auth-client';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState, useEffect } from 'react';
import s from './Navbar.module.css';
import Navlinks from './Navlinks';

const navbarContainerVariants = {
  visible: {
    opacity: 1,
    y: 0,
    backdropFilter: 'blur(10px)',
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400
    }
  },
  scrolled: {
    opacity: 1,
    y: 0,
    backdropFilter: 'blur(15px)',
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400
    }
  }
};

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const user = session?.user || null;

  // Affichage optimiste : ne pas montrer le skeleton immédiatement
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    // Afficher le skeleton seulement si le chargement prend plus de 300ms
    const timer = setTimeout(() => {
      if (isPending) {
        setShowSkeleton(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isPending]);

  useEffect(() => {
    if (!isPending) {
      setShowSkeleton(false);
    }
  }, [isPending]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const isScrollingDown = latest > lastScrollY;

    if (isScrollingDown && latest > 50) {
      setIsScrolled(true);
    } else if (!isScrollingDown && latest <= 0) {
      setIsScrolled(false);
    }

    setLastScrollY(latest);
  });

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-transparent "
      variants={navbarContainerVariants}
      animate={isScrolled ? 'scrolled' : 'visible'}
      whileHover={{
        backdropFilter: 'blur(15px)',
        transition: {
          type: 'spring',
          damping: 25,
          stiffness: 400
        }
      }}
    >
      <Navlinks user={user} isPending={showSkeleton} isScrolled={isScrolled} />
    </motion.nav>
  );
}
