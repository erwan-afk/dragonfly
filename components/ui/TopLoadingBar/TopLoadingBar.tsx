'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingProvider';

interface TopLoadingBarProps {
  height?: number;
  color?: string;
  speed?: number;
}

export default function TopLoadingBar({
  height = 3,
  color = '#3b82f6',
  speed = 300
}: TopLoadingBarProps) {
  const { isLoading } = useLoading();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      setProgress(0);

      // Simulate progressive loading
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, speed);
    } else {
      // Complete the progress bar when loading stops
      setProgress(100);
      timeoutId = setTimeout(() => {
        setProgress(0);
      }, 200);
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };
  }, [isLoading, speed]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ height: `${height}px` }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ backgroundColor: color }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.2,
              ease: 'easeOut'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
