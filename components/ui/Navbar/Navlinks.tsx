'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',

      stiffness: 400
    }
  }
};

const logoVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      type: 'spring',

      stiffness: 300
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
  }
};
export default function Navlinks({
  user,
  isPending,
  isScrolled
}: NavlinksProps) {
  const pathname = usePathname();
  return (
    <motion.div
      className="mx-auto max-w-screen-xl flex flex-row justify-between align-center text-darkgrey transition-all duration-300 py-[30px]"
      variants={navbarVariants}
      animate="visible"
    >
      <div className="flex justify-between items-center flex-1 font-medium">
        <div className="flex flex-row gap-[50px] items-center">
          <Link href="/" aria-label="Logo">
            <Logo />
          </Link>
          <nav className="flex gap-6 flex-rows items-center h-full">
            <div className="hover:underline hover:underline-offset-4">
              <Link
                href="/forsale"
                className={`hover:underline hover:underline-offset-4 ${pathname === '/forsale' ? 'text-articblue' : 'text-darkgrey'}`}
              >
                For Sale
              </Link>
            </div>

            <div className="hover:underline hover:underline-offset-4">
              <Link
                href="/forum"
                className={`hover:underline hover:underline-offset-4 ${pathname === '/forum' ? 'text-articblue' : 'text-darkgrey'}`}
              >
                Forum
              </Link>
            </div>

            <div>
              <Link
                href="/useful-links"
                className={`hover:underline hover:underline-offset-4 ${pathname === '/useful-links' ? 'text-articblue' : 'text-darkgrey'}`}
              >
                Useful Links
              </Link>
            </div>
            <div className="hover:underline hover:underline-offset-4">
              <Link
                href="/pricing"
                className={`hover:underline hover:underline-offset-4 ${pathname === '/pricing' ? 'text-articblue' : 'text-darkgrey'}`}
              >
                Pricing
              </Link>
            </div>
            <div className="hover:underline hover:underline-offset-4">
              <Link
                href="/contact"
                className={`hover:underline hover:underline-offset-4 ${pathname === '/contact' ? 'text-articblue' : 'text-darkgrey'}`}
              >
                Contact
              </Link>
            </div>
          </nav>
        </div>

        <div className="flex flex-row gap-[20px] items-center">
          {isPending ? (
            <Skeleton className="rounded-lg" isLoaded={false}>
              <div className="w-[100px] h-[24px] bg-default-200 rounded-lg" />
            </Skeleton>
          ) : user ? (
            <div className="flex flex-row gap-[10px] hover:underline hover:underline-offset-4 ">
              <Link
                href="/account"
                className={`${pathname === '/account' ? 'text-articblue' : 'text-darkgrey'} flex flex-row gap-[5px] items-center justify-center`}
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
      </div>
    </motion.div>
  );
}
