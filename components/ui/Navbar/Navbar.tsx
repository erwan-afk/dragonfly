'use client';

import { useSession } from '@/lib/auth-client';
import { motion } from 'framer-motion';
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
  }
};

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const user = session?.user || null;

  // Affichage optimiste : ne pas montrer le skeleton immédiatement
  const [showSkeleton, setShowSkeleton] = useState(false);

  // État pour le background lors du scroll
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Détecter le scroll pour changer le background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10); // Seuil de 10px pour déclencher le background
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`sticky top-0 z-50 backdrop-blur-[60px]  border-b border-transparent ${isScrolled ? 'bg-white/80 ' : ''}`}
      variants={navbarContainerVariants}
      animate="visible"
    >
      <Navlinks user={user} isPending={showSkeleton} />
    </motion.nav>
  );
}
