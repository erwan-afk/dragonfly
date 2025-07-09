'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import Logo from '@/components/icons/Logo';
import Button from '../Button/Button';
import AccountButton from '@/components/icons/AccountButton';
import { Skeleton } from '@heroui/skeleton';

interface NavlinksProps {
  user?: any;
  isPending?: boolean;
  isScrolled?: boolean;
}

// Simple but dynamic animations
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

const itemVariants = {
  hidden: { y: -20, opacity: 0, scale: 0.8 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',

      stiffness: 400
    }
  }
};

const logoVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',

      stiffness: 300
    }
  },
  hover: {
    y: -4,
    scale: 1.1,
    transition: {
      type: 'spring',
      stiffness: 400
    }
  }
};

const linkVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',

      stiffness: 400
    }
  },
  hover: {
    y: -4,
    scale: 1.05,
    transition: {
      type: 'spring',

      stiffness: 400
    }
  }
};

export default function Navlinks({
  user,
  isPending,
  isScrolled
}: NavlinksProps) {
  return (
    <motion.div
      className={`mx-auto max-w-screen-xl flex flex-row justify-between align-center text-darkgrey transition-all duration-300 ${
        isScrolled ? 'py-[20px]' : 'py-[40px]'
      }`}
      variants={navbarVariants}
      animate="visible"
    >
      <div className="flex justify-between items-center flex-1">
        <motion.div variants={logoVariants} whileHover="hover">
          <Link href="/" aria-label="Logo">
            <Logo />
          </Link>
        </motion.div>

        <div className="flex flex-row gap-40 items-center gap">
          <nav className="flex gap-6 flex-rows items-center h-full">
            <motion.div variants={linkVariants} whileHover="hover">
              <Link
                href="/forsale"
                className="hover:underline hover:underline-offset-4"
              >
                For Sale
              </Link>
            </motion.div>
            <motion.div variants={linkVariants} whileHover="hover">
              <Link
                href="/useful-links"
                className="hover:underline hover:underline-offset-4"
              >
                Useful Links
              </Link>
            </motion.div>
            <motion.div variants={linkVariants} whileHover="hover">
              <Link
                href="/contact"
                className="hover:underline hover:underline-offset-4"
              >
                Contact
              </Link>
            </motion.div>
          </nav>

          <motion.div variants={itemVariants}>
            {isPending ? (
              <Skeleton className="rounded-lg" isLoaded={false}>
                <div className="w-[100px] h-[24px] bg-default-200 rounded-lg" />
              </Skeleton>
            ) : user ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', damping: 15, stiffness: 400 }}
              >
                <Link href="/account" className="flex flex-row gap-[10px]">
                  <p>My account</p> <AccountButton />
                </Link>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.05
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Link
                  href="/signin/password_signin"
                  className="hover:underline hover:underline-offset-4"
                >
                  Sign In
                </Link>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
          >
            {isPending ? (
              // Skeleton pendant la vérification d'authentification
              <Skeleton className="rounded-lg" isLoaded={false}>
                <div className="w-[120px] h-[40px] bg-default-200 rounded-lg" />
              </Skeleton>
            ) : (
              <Button
                text="Place an ad"
                href="/list-boat"
                icon="add"
                bgColor="bg-articblue"
              />
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
