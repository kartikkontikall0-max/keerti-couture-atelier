'use client';

import React from 'react';
import { Scissors, Sparkles } from 'lucide-react';

interface AtelierImagePlaceholderProps {
  title?: string;
  category?: string;
  aspectRatio?: string;
  className?: string;
}

export function AtelierImagePlaceholder({
  title,
  category = 'Bespoke Blouse',
  aspectRatio = 'aspect-[4/5]',
  className = '',
}: AtelierImagePlaceholderProps) {
  return (
    <div
      className={`relative w-full ${aspectRatio} flex flex-col items-center justify-between p-6 sm:p-8 bg-gradient-to-b from-[#FAF8F5] via-[#F5EFE6] to-[#ECE3D4] border border-gold/25 overflow-hidden select-none ${className}`}
    >
      {/* Decorative Gold Inset Corner Accents */}
      <div className="absolute inset-3 border border-gold/20 pointer-events-none rounded-xl" />
      <div className="absolute top-4 left-4 h-3 w-3 border-t-2 border-l-2 border-gold/60" />
      <div className="absolute top-4 right-4 h-3 w-3 border-t-2 border-r-2 border-gold/60" />
      <div className="absolute bottom-4 left-4 h-3 w-3 border-b-2 border-l-2 border-gold/60" />
      <div className="absolute bottom-4 right-4 h-3 w-3 border-b-2 border-r-2 border-gold/60" />

      {/* Top Header Label */}
      <div className="relative z-10 flex items-center gap-1.5 text-primary text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-center">
        <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
        <span>Keerti Couture Archive</span>
      </div>

      {/* Center Motif & Title */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xs space-y-3 my-auto">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-champagne/80 border border-gold/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
          <Scissors className="h-8 w-8 sm:h-10 sm:w-10 text-primary rotate-45" />
        </div>

        {title && (
          <h4 className="font-serif font-bold text-sm sm:text-base text-foreground tracking-tight line-clamp-2 px-2">
            {title}
          </h4>
        )}

        <div className="inline-block px-3 py-1 rounded-full bg-white/70 border border-gold/20 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
          {category}
        </div>
      </div>

      {/* Bottom Provenance Notice */}
      <div className="relative z-10 text-center space-y-1">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-primary/80 block">
          Tailoring Specification
        </span>
        <p className="text-[8px] sm:text-[9px] text-muted-foreground/80 tracking-wide">
          Bespoke swatch & sketch at atelier fitting
        </p>
      </div>
    </div>
  );
}

