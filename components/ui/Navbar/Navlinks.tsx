'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import Logo from '@/components/icons/Logo';
import Button from '../Button/Button';
import AccountButton, {
  AccountButtonFilled
} from '@/components/icons/AccountButton';
import { Skeleton } from '@heroui/skeleton';
import { usePathname } from 'next/navigation';

interface NavlinksProps {
  user?: any;
  isPending?: boolean;
  isScrolled?: boolean;
}

const navbarVariants = {
  hidden: { y: -80, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      staggerChildren: 0.1
    }
  }
};

const mobileMenuVariants = {
  closed: {
    x: '100%',
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  open: {
    x: 0,
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
};

export default function Navlinks({
  user,
  isPending,
  isScrolled
}: NavlinksProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/forsale', label: 'For Sale' },
    { href: '/forum', label: 'Forum' },
    { href: '/useful-links', label: 'Useful Links' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' }
  ];

  return (
    <>
      <motion.div
        className="relative mx-auto max-w-screen-xl flex flex-row justify-between items-center text-darkgrey transition-all duration-300 py-[16px] lg:py-[30px] px-16 xs:px-16 xl:px-0"
        variants={navbarVariants}
        animate="visible"
      >
        <div className="flex justify-between items-center flex-1 font-medium">
          <div className="flex flex-row gap-[20px] md:gap-[50px] items-center">
            <Link href="/" aria-label="Logo">
              <span className="sm:hidden">
                <Logo small />
              </span>
              <span className="hidden sm:inline">
                <Logo />
              </span>
            </Link>
            {/* Desktop nav */}
            <nav className="hidden lg:flex gap-6 flex-rows items-center h-full">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className="hover:underline hover:underline-offset-4"
                >
                  <Link
                    href={link.href}
                    className={`hover:underline hover:underline-offset-4 ${pathname === link.href ? 'text-articblue' : 'text-darkgrey'}`}
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Desktop right side */}
          <div className="hidden lg:flex flex-row gap-[20px] items-center">
            {isPending ? (
              <Skeleton className="rounded-lg" isLoaded={false}>
                <div className="w-[100px] h-[24px] bg-default-200 rounded-lg" />
              </Skeleton>
            ) : user ? (
              <div className="flex flex-row gap-[20px] items-center">
                {(user.role === 'admin' || user.role === 'superAdmin') && (
                  <Link
                    href="/admin"
                    className={`hover:underline hover:underline-offset-4 ${pathname === '/admin' ? 'text-articblue' : 'text-darkgrey'} flex flex-row gap-[5px] items-center justify-center`}
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  className={`hover:underline hover:underline-offset-4 ${pathname === '/account' ? 'text-articblue' : 'text-darkgrey'} flex flex-row gap-[5px] items-center justify-center`}
                >
                  {pathname === '/account' ? (
                    <AccountButtonFilled className="text-articblue w-[15px] h-[15px]" />
                  ) : (
                    <AccountButton className="w-[15px] h-[15px]" />
                  )}
                  Profile
                </Link>
              </div>
            ) : (
              <Link
                href="/signin/password_signin"
                className={`hover:underline hover:underline-offset-4 ${pathname === '/signin' ? 'text-articblue' : 'text-darkgrey'}`}
              >
                Sign In
              </Link>
            )}

            <div className="w-[1px] h-[20px] bg-stonegrey"></div>

            <Button
              text="Place an ad"
              href="/list-boat"
              icon="add"
              bgColor="bg-articblue"
            />
          </div>

          {/* Mobile: CTA + Profile + Hamburger */}
          <div className="flex lg:hidden flex-row gap-16 items-center ml-auto">
            <span className="hidden xs:inline">
              <Button
                text="Place an ad"
                href="/list-boat"
                icon="add"
                bgColor="bg-articblue"
                textsize="text-12"
              />
            </span>
            <span className="xs:hidden">
              <Button
                text="Place an ad"
                href="/list-boat"
                bgColor="bg-articblue"
                lowercase
                anim_disabled
                textsize="text-[12px]"
              />
            </span>
            {!isPending && user && (
              <Link href="/account" aria-label="Profile">
                {pathname === '/account' ? (
                  <AccountButtonFilled className="text-articblue w-[20px] h-[20px]" />
                ) : (
                  <AccountButton className="w-[20px] h-[20px] text-darkgrey" />
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-darkgrey"
              aria-label="Toggle menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
      {/* Mobile menu - full page overlay (portal to body to escape transform context) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="fixed inset-0 h-[100dvh] bg-fullwhite text-darkgrey lg:hidden z-[9999] flex flex-col overflow-hidden"
                variants={mobileMenuVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                {/* Header: logo + close */}
                <div className="flex items-center justify-between px-16 xs:px-16 py-[16px] border-b border-stonegrey/20">
                  <Link
                    href="/"
                    aria-label="Logo"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="sm:hidden">
                      <Logo small />
                    </span>
                    <span className="hidden sm:inline">
                      <Logo />
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-darkgrey"
                    aria-label="Close menu"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Auth prompt */}
                <div className="px-16 xs:px-16 py-16 border-b border-stonegrey/20">
                  {isPending ? (
                    <Skeleton className="rounded-lg" isLoaded={false}>
                      <div className="w-full h-[40px] bg-default-200 rounded-lg" />
                    </Skeleton>
                  ) : user ? (
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-8 text-darkgrey"
                    >
                      {pathname === '/account' ? (
                        <AccountButtonFilled className="text-articblue w-[24px] h-[24px]" />
                      ) : (
                        <AccountButton className="w-[24px] h-[24px]" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-16 font-medium">
                          {user.name || 'My Profile'}
                        </span>
                        <span className="text-14 text-stonegrey">
                          View my profile
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href="/signin/password_signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-8 text-16 text-darkgrey"
                    >
                      <AccountButton className="w-[20px] h-[20px]" />
                      <span>
                        <span className="underline font-medium">Sign in</span>{' '}
                        to access all features
                      </span>
                    </Link>
                  )}
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-16 xs:px-16 py-16 text-16 font-medium border-b border-stonegrey/10 ${pathname === link.href ? 'text-articblue underline underline-offset-4' : 'text-darkgrey'} transition-colors`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {user &&
                    (user.role === 'admin' || user.role === 'superAdmin') && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`px-16 xs:px-16 py-16 text-16 font-medium border-b border-stonegrey/10 ${pathname === '/admin' ? 'text-articblue underline underline-offset-4' : 'text-darkgrey'} transition-colors`}
                      >
                        Dashboard
                      </Link>
                    )}
                </nav>

                {/* Bottom CTA */}
                <div className="px-16 xs:px-16 py-16 border-t border-stonegrey/20 flex flex-col items-center gap-8">
                  <span className="text-16 text-darkgrey">Sell my boat</span>
                  <Button
                    text="Place an ad"
                    href="/list-boat"
                    icon="add"
                    bgColor="bg-articblue"
                    fullwidth
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
