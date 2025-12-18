'use client';

import Button from '@/components/ui/Button/Button';
import Scroll from '@/components/icons/Scroll';
import SearchBar from '@/components/SearchBar';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <div className="flex flex-col gap-64 w-full mx-auto max-w-screen-xl">
      {/* <section
        className="mx-auto max-w-screen-xl max-h-[730px] rounded-16 text-center bg-cover bg-bottom h-[70vh] p-[32px] flex flex-row justify-between items-end"
        style={{ backgroundImage: `url('/images/ocean.png')` }}
      >
        <div className="w-[40%] bg-oceanblue/40 backdrop-blur-md h-full rounded-16 flex flex-col justify-center items-start gap-40 p-32">
          <div className="flex flex-col items-start gap-24">
            <span className="italic text-16">About us</span>
            <h1 className="text-40 text-left font-medium leading-[100%]">
              Dragonfly trimaran user forum
            </h1>
          </div>

          <p className="text-left w-[70%] font-light ">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
            consectetur quis enim ut volutpat. In massa nulla, blandit sit amet
            semper eget, accumsan eget nisl. In facilisis felis nulla.{' '}
          </p>
          <Button
            text="Sign in"
            icon="link"
            bgColor="bg-fullwhite"
            iconColor="text-oceanblue"
            href="/place-ad"
          />
        </div>
        <div className="w-fit bg-fullwhite h-fit flex flex-row rounded-16 p-24 gap-16">
          <div className="flex flex-col justify-center w-[120px]">
            <div className="font-medium text-32 text-articblue leading-[100%]">
              +4k
            </div>
            <div className="text-24 text-oceanblue ">members</div>
          </div>
          <div className="w-[2px] min-h-[100%] bg-stonegrey"></div>
          <div className="flex flex-col justify-center w-[120px]">
            <div className="font-medium text-32 text-articblue leading-[100%] ">
              +800
            </div>
            <div className="text-24 text-oceanblue">ads</div>
          </div>
        </div>
      </section> */}

      <section className="w-full  p-40 rounded-16  flex flex-row justify-between items-center bg-[url('/images/dragonfly-boat.webp')]  text-40 font-medium bg-cover bg-center ">
        <SearchBar />

        <div className="text-fullwhite text-40 px-32">
          Find the boat <br />
          that suits you
        </div>
      </section>

      <section className="flex flex-col gap-32">
        <h1 className="text-oceanblue text-32">
          The most <span className="text-articblue">popular</span> models
        </h1>

        <div className="flex flex-row gap-32">
          <Link
            href="/forsale?model=df25"
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/images/boat-1.webp"
              alt="Dragonfly 25"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 z-10 m-2 text-oceanblue text-16 bg-fullwhite  px-2 py-1 rounded-8 text-center font-medium">
              Dragonfly 25
            </div>
          </Link>
          <Link
            href="/forsale?model=df28"
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/images/boat-2.webp"
              alt="Dragonfly 28"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 z-10 m-2 text-oceanblue text-16 bg-fullwhite  px-2 py-1 rounded-8 text-center font-medium">
              Dragonfly 28
            </div>
          </Link>
          <Link
            href="/forsale?model=df32"
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/images/boat-3.webp"
              alt="Dragonfly 32"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 z-10 m-2 text-oceanblue text-16 bg-fullwhite  px-2 py-1 rounded-8 text-center font-medium">
              Dragonfly 32
            </div>
          </Link>
          <Link
            href="/forsale?model=df40"
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-[200px] w-full rounded-16 overflow-hidden"
          >
            <img
              src="/images/boat-4.webp"
              alt="Dragonfly 40"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />

            <div
              className="absolute bottom-0 left-0 z-10 m-2
                  bg-fullwhite text-oceanblue text-16
                  px-2 py-1 rounded-8 font-medium"
            >
              Dragonfly 40
            </div>
          </Link>
        </div>
      </section>

      {/* <section className="mx-auto max-w-screen-xl flex flex-col justify-center items-center h-[120px] text-articblue text-20">
        <motion.a
          className="flex flex-row items-center gap-[9px] p-6 cursor-pointer"
          href="#Boats"
          whileHover={{
            y: -4,
            scale: 1.05
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <Scroll />
          <div>Scroll down</div>
        </motion.a>
      </section> */}
    </div>
  );
}
