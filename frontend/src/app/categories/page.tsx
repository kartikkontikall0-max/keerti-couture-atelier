'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

const categories = [
  {
    name: 'Bridal & Muhurtham',
    slug: 'Bridal',
    tagline: 'Heavy Zardozi, Maggam Work & Pearl Highlights',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    count: '18 Silhouettes',
  },
  {
    name: 'Contemporary Cutwork',
    slug: 'Designer',
    tagline: 'Illusion Yokes, Scalloped Edges & Sheer Panels',
    image: 'https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?auto=format&fit=crop&q=80&w=800',
    count: '24 Silhouettes',
  },
  {
    name: 'Royal Boat Neck',
    slug: 'Boat',
    tagline: 'Flattering Collarbone Line for Kanjeevarams & Silks',
    image: 'https://images.unsplash.com/photo-1563172044-8da8f6bf744b?auto=format&fit=crop&q=80&w=800',
    count: '15 Silhouettes',
  },
  {
    name: 'Princess Cut Silhouettes',
    slug: 'Traditional',
    tagline: 'Bespoke Contoured Bust Seams for Supreme Comfort',
    image: 'https://images.unsplash.com/photo-1555529733-0e670560f8e1?auto=format&fit=crop&q=80&w=800',
    count: '22 Silhouettes',
  },
  {
    name: 'Statement Back Cutouts',
    slug: 'Designer',
    tagline: 'Teardrops, Deep Us, and Hand-Knotted Dori Ties',
    image: 'https://images.unsplash.com/photo-1550614000-4b95dd2447fa?auto=format&fit=crop&q=80&w=800',
    count: '20 Silhouettes',
  },
  {
    name: 'Classic Everyday Silk',
    slug: 'Casual',
    tagline: 'Breathable Linings for Festive Dinners & Daily Wear',
    image: 'https://images.unsplash.com/photo-1600188769045-bc602d2de5c7?auto=format&fit=crop&q=80&w=800',
    count: '16 Silhouettes',
  },
  {
    name: 'Heritage Pleated Puffs',
    slug: 'Traditional',
    tagline: 'Puffed Sleeves with Contrast Zari Borders',
    image: 'https://images.unsplash.com/photo-1627372332675-9e6639b7d8d2?auto=format&fit=crop&q=80&w=800',
    count: '12 Silhouettes',
  },
  {
    name: 'Clean Sleeveless Modern',
    slug: 'Designer',
    tagline: 'Reinforced Bias Binding & Sculpted Armholes',
    image: 'https://images.unsplash.com/photo-1550639525-c97d455acf70?auto=format&fit=crop&q=80&w=800',
    count: '14 Silhouettes',
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Editorial Header */}
      <section className="bg-champagne/30 border-b border-gold/15 py-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-widest font-bold">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>Curated Silhouettes</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground">
            Explore by Silhouette & Occasion
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Discover our bespoke blouse archives categorized by neckline, occasion, and artisanal embroidery technique.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {categories.map((cat, idx) => (
            <Link
              key={cat.name}
              href={`/designs?category=${encodeURIComponent(cat.slug)}`}
              className="group block"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-xs hover:shadow-xl transition-all duration-500 bg-card"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-widest font-medium">
                    {cat.count}
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1.5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gold-light font-medium block">
                    Collection
                  </span>
                  <h3 className="font-serif text-xl font-bold tracking-tight text-white group-hover:text-gold-light transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-white/75 leading-relaxed line-clamp-2">
                    {cat.tagline}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold-light font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>View Silhouettes</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
