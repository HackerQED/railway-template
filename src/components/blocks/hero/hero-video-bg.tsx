'use client';

import { useEffect, useRef, useState } from 'react';

interface HeroVideoBgProps {
  videoUrl: string;
  posterUrl: string;
  children: React.ReactNode;
  className?: string;
}

export function HeroVideoBg({
  videoUrl,
  posterUrl,
  children,
  className = '',
}: HeroVideoBgProps) {
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Once the video can play through, fade it in over the poster
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => setVideoReady(true);
    video.addEventListener('canplaythrough', onCanPlay);

    // In case it's already ready (cached)
    if (video.readyState >= 4) {
      setVideoReady(true);
    }

    return () => video.removeEventListener('canplaythrough', onCanPlay);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Poster image — loads instantly, always present underneath */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${posterUrl})` }}
      />

      {/* Video — fades in over poster when ready */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={posterUrl}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          videoReady ? 'opacity-100' : 'opacity-0'
        }`}
        onLoadedData={() => {
          // Belt-and-suspenders: also trigger on loadeddata
          if (videoRef.current && videoRef.current.readyState >= 3) {
            setVideoReady(true);
          }
        }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Bottom gradient fade to page background — tall, multi-stop for a soft blend */}
      <div
        className="absolute inset-x-0 bottom-0 h-[35vh]"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.7) 30%, hsl(var(--background) / 0.3) 60%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}
