import React from 'react';
import { motion } from 'framer-motion';

interface ScreenTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.995 }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1], // Smooth natural cubic easing
      }}
      className={`w-full flex flex-col items-center justify-center ${className}`}
    >
      {children}
    </motion.div>
  );
};
