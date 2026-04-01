'use client';

import { FlipWords } from '@/components/ui/flip-words';
import { motion } from 'motion/react';
import { type CSSProperties, useEffect, useState } from 'react';

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

const colors = { first: '#22c55e', second: '#a78bfa' };

function generateSparkle(): Sparkle {
  return {
    id: `${Math.random()}`,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    color: Math.random() > 0.5 ? colors.first : colors.second,
    delay: Math.random() * 2,
    scale: Math.random() * 1 + 0.3,
    lifespan: Math.random() * 10 + 5,
  };
}

export function HeroTitle({
  prefix,
  flipWords,
  suffix,
}: {
  prefix: string;
  flipWords: string[];
  suffix: string;
}) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    setSparkles(Array.from({ length: 8 }, generateSparkle));
    const interval = setInterval(() => {
      setSparkles((current) =>
        current.map((s) =>
          s.lifespan <= 0
            ? generateSparkle()
            : { ...s, lifespan: s.lifespan - 0.1 }
        )
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.h1
      initial={{ opacity: 0, filter: 'blur(4px)', y: 12 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
      className="mt-8 text-balance text-5xl font-bricolage-grotesque lg:mt-16 xl:text-[5rem]"
    >
      {flipWords.length > 0 ? (
        <>
          {prefix}{' '}
          <span
            className="relative inline-block"
            style={
              {
                '--sparkles-first-color': colors.first,
                '--sparkles-second-color': colors.second,
              } as CSSProperties
            }
          >
            {sparkles.map((sparkle) => (
              <motion.svg
                key={sparkle.id}
                className="pointer-events-none absolute z-20"
                initial={{ opacity: 0, left: sparkle.x, top: sparkle.y }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, sparkle.scale, 0],
                  rotate: [75, 120, 150],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: sparkle.delay,
                }}
                width="21"
                height="21"
                viewBox="0 0 21 21"
              >
                <path
                  d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
                  fill={sparkle.color}
                />
              </motion.svg>
            ))}
            <FlipWords words={flipWords} duration={1500} />
          </span>
        </>
      ) : (
        prefix
      )}
      {suffix && <span className="block">{suffix}</span>}
    </motion.h1>
  );
}
