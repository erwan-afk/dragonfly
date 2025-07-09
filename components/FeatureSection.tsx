'use client';

import Button from '@/components/ui/Button/Button';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
import React, { useRef } from 'react';

interface AnimatedParagraphProps {
  text: string;
  className: string;
}

interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}

interface CharProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}

// Composant pour animer le paragraphe
const AnimatedParagraph = ({ text, className }: AnimatedParagraphProps) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start 0.9', 'start 0.5']
  });

  const words = text.split(' ');

  return (
    <div ref={container} className={className}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;

        // Ajoute un retour à la ligne au changement de couleur (après "are")
        const shouldBreakAfter = word === 'in';

        return (
          <React.Fragment key={i}>
            <Word progress={scrollYProgress} range={[start, end]}>
              {word}
            </Word>
            {shouldBreakAfter && <br />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Word = ({ children, progress, range }: WordProps) => {
  const amount = range[1] - range[0];
  const step = amount / children.length;

  // Détermine la couleur selon le mot
  const getWordColor = (word: string) => {
    if (
      word === '84%' ||
      word === 'sold' ||
      word === 'in' ||
      word === 'less' ||
      word === 'than' ||
      word === 'a' ||
      word === 'month.'
    ) {
      return 'text-articblue';
    }
    return 'text-oceanblue';
  };

  return (
    <span
      className={`relative mr-3 mt-3 inline-block ${getWordColor(children)}`}
    >
      {children.split('').map((char: string, i: number) => {
        const start = range[0] + i * step;
        const end = range[0] + (i + 1) * step;
        return (
          <Char key={`c_${i}`} progress={progress} range={[start, end]}>
            {char}
          </Char>
        );
      })}
    </span>
  );
};

const Char = ({ children, progress, range }: CharProps) => {
  const opacity = useTransform(progress, range, [0, 1]);

  return (
    <span className="relative">
      <span className="absolute opacity-20">{children}</span>
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
};

export default function FeatureSection() {
  return (
    <section className="mx-auto max-w-screen-xl flex flex-col justify-center items-center gap-40 py-[80px]">
      <motion.div
        className="text-oceanblue italic flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Our performance
      </motion.div>

      <div className="flex flex-col max-w-5xl">
        <AnimatedParagraph
          text="84% of our boats are sold in less than a month."
          className="text-48 text-oceanblue text-center flex-wrap leading-tight"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Button
          text="Sign in"
          icon="link"
          bgColor="bg-fullwhite"
          iconColor="text-articblue"
          href="/place-ad"
          outline="border-articblue"
          textColor="text-oceanblue"
        />
      </motion.div>
    </section>
  );
}
