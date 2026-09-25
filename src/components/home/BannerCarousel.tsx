'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { fetchActiveBanners } from '@/lib/services/banners';
import { Banner } from '@/types';

interface BannerCarouselProps {
  initialBanners?: Banner[];
}

export default function BannerCarousel({ initialBanners }: BannerCarouselProps = {}) {
  const [dbBanners, setDbBanners] = useState<Banner[] | null>(
    initialBanners && initialBanners.length > 0 ? initialBanners : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialBanners || initialBanners.length === 0);

  useEffect(() => {
    let isMounted = true;
    fetchActiveBanners()
      .then((items) => {
        if (isMounted) {
          if (items && items.length > 0) {
            setDbBanners(items);
          } else {
            setDbBanners([]);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[SUPABASE BANNERS ERROR] BannerCarousel fetch failed:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeBanners = dbBanners || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    if (activeBanners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prevSlide = useCallback(() => {
    if (activeBanners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    if (isPaused || activeBanners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, activeBanners.length]);

  // Loading skeleton while waiting for DB banners
  if (isLoading && activeBanners.length === 0) {
    return (
      <section className="relative w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4">
        <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[320px] h-[340px] sm:h-[400px] lg:h-[480px] xl:h-[500px] animate-pulse flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Sparkles className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Cargando ofertas...</span>
          </div>
        </div>
      </section>
    );
  }

  // If no banners in DB, do not render or show empty state
  if (activeBanners.length === 0) {
    return null;
  }

  const current = activeBanners[currentIndex];
  const isImageOnly = current.displayMode === 'image_only';

  const posX = typeof current.imagePositionX === 'number'
    ? current.imagePositionX
    : current.imagePosition === 'left' ? 0 : current.imagePosition === 'right' ? 100 : 50;

  const posY = typeof current.imagePositionY === 'number'
    ? current.imagePositionY
    : 50;

  const zoom = typeof current.imageZoom === 'number' ? current.imageZoom : 1.0;
  const fit = current.imageFit === 'contain' ? 'contain' : 'cover';

  return (
    <section 
      className="relative w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800/80 min-h-[320px] h-[340px] sm:h-[400px] lg:h-[480px] xl:h-[500px] flex items-center">
        
        {/* Full Image Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={current.imageUrl}
            alt={current.title || 'Banner GIVA 3D'}
            fill
            priority
            className="w-full h-full opacity-100 transition-transform duration-500 ease-out"
            style={{
              objectFit: fit,
              objectPosition: `${posX}% ${posY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${posX}% ${posY}%`,
            }}
            sizes="(max-width: 1920px) 100vw, 1720px"
          />

          {/* Overlay: ONLY for 'with_content' mode, soft gradient on the left side */}
          {!isImageOnly && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent max-w-3xl pointer-events-none" />
          )}
        </div>

        {/* If 'image_only' mode has linkUrl, make banner clickable */}
        {isImageOnly && current.linkUrl && (
          <Link
            href={current.linkUrl}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={current.title || 'Ver promoción'}
          />
        )}

        {/* Content Container (ONLY for 'with_content' mode) */}
        {!isImageOnly && (
          <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-2xl flex flex-col justify-center">
            {current.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-cyan-300 border border-purple-400/30 w-fit mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{current.badge}</span>
              </div>
            )}

            {current.title && (
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2 sm:mb-4 drop-shadow-md">
                {current.title}
              </h2>
            )}

            {current.subtitle && (
              <p className="text-xs sm:text-base text-slate-200 leading-relaxed max-w-xl mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 drop-shadow">
                {current.subtitle}
              </p>
            )}

            {current.buttonText && current.linkUrl && (
              <div>
                <Link
                  href={current.linkUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-brand text-white font-bold text-xs sm:text-sm hover:opacity-95 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <span>{current.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Navigation Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-3 sm:left-6 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/20 shadow-lg hover:scale-105 active:scale-95"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-3 sm:right-6 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/20 shadow-lg hover:scale-105 active:scale-95"
              aria-label="Siguiente banner"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Dots Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full ${
                  currentIndex === idx
                    ? 'w-7 h-2.5 bg-gradient-brand shadow-md shadow-purple-500/50'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ir al banner ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
