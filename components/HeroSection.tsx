'use client';

import Button from '@/components/ui/Button/Button';
import Scroll from '@/components/icons/Scroll';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <>
      <section
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
      </section>

      <section className="mx-auto max-w-screen-xl flex flex-col justify-center items-center h-[120px] text-articblue text-20">
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
      </section>
    </>
  );
}
