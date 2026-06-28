'use client';

import Button from '@/components/ui/Button/Button';
import Scroll from '@/components/icons/Scroll';
import SearchBar from '@/components/SearchBar';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <div className="flex flex-col gap-32 lg:gap-64 w-full mx-auto max-w-screen-xl">
      {/* Mobile: image with text overlay + search below */}
      <section className="md:hidden w-screen relative left-1/2 -translate-x-1/2  flex flex-col">
        <div className="relative w-full h-[160px] xs:h-[200px] overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/dragonfly-boat.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex items-start justify-center h-full p-[24px]">
            <div className="text-fullwhite text-24 font-medium text-center">
              Find the boat <br />
              that suits you
            </div>
          </div>
        </div>
        <div className="p-0 xs:p-16 bg-fullwhite -mt-10 relative z-10 mx-16 xs:mx-32 shadow-lg rounded-8">
          <SearchBar />
        </div>
      </section>

      {/* Desktop: side by side */}
      <section className="hidden md:flex w-full mt-16 lg:mt-32 md:p-24 lg:p-40 rounded-16 flex-row justify-between items-center bg-[url('/images/dragonfly-boat.webp')] text-40 font-medium bg-cover bg-center">
        <SearchBar />

        <div className="text-fullwhite md:text-32 lg:text-40 md:px-16 lg:px-32 text-right">
          Find the boat <br />
          that suits you
        </div>
      </section>

      <section className="flex flex-col gap-24 lg:gap-32 px-16 md:px-0">
        <h1 className="text-oceanblue text-24 md:text-32">
          The most <span className="text-articblue">popular</span> models
        </h1>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-32">
          <Link
            href="/forsale?model=df25"
            target="_self"
            rel="noopener noreferrer"
            className="relative h-[140px] lg:h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/models/df25.jpg"
              alt="Dragonfly 25"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 z-10 m-2 text-oceanblue text-14 lg:text-16 bg-fullwhite px-2 py-1 rounded-8 text-center font-medium">
              Dragonfly 25
            </div>
          </Link>
          <Link
            href="/forsale?model=df28"
            target="_self"
            rel="noopener noreferrer"
            className="relative h-[140px] lg:h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/models/df28.jpg"
              alt="Dragonfly 28"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 z-10 m-2 text-oceanblue text-14 lg:text-16 bg-fullwhite px-2 py-1 rounded-8 text-center font-medium">
              Dragonfly 28
            </div>
          </Link>
          <Link
            href="/forsale?model=df32"
            target="_self"
            rel="noopener noreferrer"
            className="relative h-[140px] lg:h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/models/df32.jpg"
              alt="Dragonfly 32"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 z-10 m-2 text-oceanblue text-14 lg:text-16 bg-fullwhite px-2 py-1 rounded-8 text-center font-medium">
              Dragonfly 32
            </div>
          </Link>
          <Link
            href="/forsale?model=df920"
            target="_self"
            rel="noopener noreferrer"
            className="relative h-[140px] lg:h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/models/df920.jpg"
              alt="Dragonfly 920"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />

            <div
              className="absolute bottom-0 left-0 z-10 m-2
                  bg-fullwhite text-oceanblue text-14 lg:text-16
                  px-2 py-1 rounded-8 font-medium"
            >
              Dragonfly 920
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
