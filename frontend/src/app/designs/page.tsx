'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Search, SlidersHorizontal, ArrowRight, X, Heart, Sparkles, ArrowUpDown, Info } from 'lucide-react';
import axios from 'axios';
import API_URL from '@/lib/api';
import { AtelierImagePlaceholder } from '@/components/ui/AtelierImagePlaceholder';

interface Design {
  _id: string;
  name: string;
  category: string;
  price: number;
  neckStyle?: string;
  sleeveType?: string;
  backDesign?: string;
  images: { url: string; public_id?: string }[];
}

const CATEGORY_TABS = [
  { label: 'All Silhouettes', value: 'All' },
  { label: 'Bridal Blouse', value: 'Bridal Blouse' },
  { label: 'Silk Blouse', value: 'Silk Blouse' },
  { label: 'Traditional', value: 'Traditional' },
  { label: 'Party Wear', value: 'Party Wear' },
  { label: 'Modern', value: 'Modern' },
  { label: 'Embroidered', value: 'Embroidered' },
];

function DesignGalleryContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [allDesigns, setAllDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [neckFilter, setNeckFilter] = useState('All');
  const [sleeveFilter, setSleeveFilter] = useState('All');
  const [backFilter, setBackFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const [showFilters, setShowFilters] = useState(false);

  // Sync category from URL param if it changes
  useEffect(() => {
    const urlCat = searchParams.get('category');
    if (urlCat) {
      setCategory(urlCat);
    }
  }, [searchParams]);

  // Load favorites from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('favoriteDesigns');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter((favId) => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    try {
      localStorage.setItem('favoriteDesigns', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_URL}/designs`);
        setAllDesigns(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load designs from backend', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDesigns();
  }, []);

  // Filter & Sort computation
  const filteredAndSortedDesigns = useMemo(() => {
    const result = allDesigns.filter((design) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        design.name.toLowerCase().includes(q) ||
        design.category.toLowerCase().includes(q) ||
        (design.neckStyle && design.neckStyle.toLowerCase().includes(q)) ||
        (design.sleeveType && design.sleeveType.toLowerCase().includes(q));

      const matchCat =
        category === 'All' ||
        design.category.toLowerCase().includes(category.toLowerCase()) ||
        (category === 'Bridal' && design.category.toLowerCase().includes('bridal')) ||
        (category === 'Designer' && design.category.toLowerCase().includes('designer'));

      const matchNeck =
        neckFilter === 'All' ||
        (design.neckStyle && design.neckStyle.toLowerCase().includes(neckFilter.toLowerCase()));

      const matchSleeve =
        sleeveFilter === 'All' ||
        (design.sleeveType && design.sleeveType.toLowerCase().includes(sleeveFilter.toLowerCase()));

      const matchBack =
        backFilter === 'All' ||
        (design.backDesign && design.backDesign.toLowerCase().includes(backFilter.toLowerCase()));

      return matchSearch && matchCat && matchNeck && matchSleeve && matchBack;
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [allDesigns, searchTerm, category, neckFilter, sleeveFilter, backFilter, sortBy]);

  const hasActiveFilters =
    category !== 'All' ||
    neckFilter !== 'All' ||
    sleeveFilter !== 'All' ||
    backFilter !== 'All' ||
    searchTerm !== '' ||
    sortBy !== 'featured';

  const resetAllFilters = () => {
    setSearchTerm('');
    setCategory('All');
    setNeckFilter('All');
    setSleeveFilter('All');
    setBackFilter('All');
    setSortBy('featured');
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* 1. EDITORIAL HEADER */}
      <section className="w-full bg-champagne/30 border-b border-gold/15 py-10 sm:py-14 lg:py-16">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-4">
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.25em] font-semibold">
            <Sparkles className="h-4 w-4 text-gold shrink-0" />
            <span>Bespoke Couture Archive</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-foreground">
                The Blouse Gallery
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Explore handpicked designer blouses crafted by our master tailors. Every design can be customized to your exact necklines, sleeve preferences, and made-to-measure sizing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground font-semibold px-4 py-2 rounded-full bg-card/80 border border-border shadow-xs">
                Showing {filteredAndSortedDesigns.length} of {allDesigns.length} Silhouettes
              </span>
            </div>
          </div>

          {/* Category Tabs (Quick Switcher) */}
          <div className="pt-4 w-full max-w-full flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-none overscroll-x-contain touch-pan-x px-0.5">
            {CATEGORY_TABS.map((tab) => {
              const isSelected =
                (tab.value === 'All' && category === 'All') ||
                (tab.value !== 'All' && category.toLowerCase().includes(tab.value.toLowerCase()));
              return (
                <button
                  key={tab.value}
                  onClick={() => setCategory(tab.value)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-wider font-semibold whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-card text-foreground/80 hover:bg-champagne/60 border border-border shadow-xs'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. SEARCH & ADVANCED FILTER DRAWER BAR */}
      <section className="sticky top-16 sm:top-20 z-30 w-full bg-background/95 backdrop-blur-md border-b border-border py-3 sm:py-4 shadow-xs">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by neckline, embroidery, silhouette..."
              className="w-full h-11 sm:h-12 pl-11 pr-4 rounded-full border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Sort & Filter Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2 sm:py-2.5 bg-card text-xs sm:text-sm flex-1 sm:flex-initial shadow-xs">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort silhouettes by"
                className="bg-transparent border-none text-xs sm:text-sm font-semibold text-foreground outline-none cursor-pointer w-full"
              >
                <option value="featured">Featured Archive</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all shrink-0 min-h-[40px] shadow-xs ${
                showFilters || (hasActiveFilters && category === 'All')
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-card text-foreground border-border hover:bg-champagne/40'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-gold inline-block" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Filter Grid */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-2 border-t border-border mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Neckline Style
                  </label>
                  <select
                    value={neckFilter}
                    onChange={(e) => setNeckFilter(e.target.value)}
                    aria-label="Filter by Neckline Style"
                    className="w-full h-11 px-3 rounded-lg border border-border bg-card text-xs sm:text-sm font-medium text-foreground outline-none focus:border-gold"
                  >
                    <option value="All">All Necklines</option>
                    <option value="Round">Round Neck</option>
                    <option value="Boat">Boat Neck</option>
                    <option value="Sweetheart">Sweetheart Neck</option>
                    <option value="V-Neck">V-Neck</option>
                    <option value="Square">Square Neck</option>
                    <option value="Halter">Halter Neck</option>
                    <option value="Collar">Collar / Lapel</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Sleeve Silhouette
                  </label>
                  <select
                    value={sleeveFilter}
                    onChange={(e) => setSleeveFilter(e.target.value)}
                    aria-label="Filter by Sleeve Silhouette"
                    className="w-full h-11 px-3 rounded-lg border border-border bg-card text-xs sm:text-sm font-medium text-foreground outline-none focus:border-gold"
                  >
                    <option value="All">All Sleeves</option>
                    <option value="Sleeveless">Sleeveless</option>
                    <option value="Cap">Cap Sleeves</option>
                    <option value="Short">Short Sleeves</option>
                    <option value="Elbow">Elbow Length</option>
                    <option value="3/4th">3/4th Sleeves</option>
                    <option value="Long">Long Sleeves</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    Back Cutout
                  </label>
                  <select
                    value={backFilter}
                    onChange={(e) => setBackFilter(e.target.value)}
                    aria-label="Filter by Back Cutout"
                    className="w-full h-11 px-3 rounded-lg border border-border bg-card text-xs sm:text-sm font-medium text-foreground outline-none focus:border-gold"
                  >
                    <option value="All">All Back Designs</option>
                    <option value="Deep">Deep Back</option>
                    <option value="Keyhole">Keyhole Cutout</option>
                    <option value="Dori">Dori / Tie-Up</option>
                    <option value="Buttons">Buttons</option>
                    <option value="Closed">Closed / Modest</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetAllFilters}
                    className="w-full h-11 rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-xs uppercase tracking-wider font-bold text-foreground transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. PRODUCT GRID */}
      <section className="w-full py-10 sm:py-14 lg:py-16">
        <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-8 xl:gap-10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-4 bg-card rounded-2xl p-4 border border-border">
                  <div className="aspect-[4/5] bg-muted rounded-xl" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ) : filteredAndSortedDesigns.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 rounded-full bg-champagne flex items-center justify-center text-gold border border-gold/20">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-foreground">No Matching Silhouettes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We couldn't find any designs matching your selected filters. Try broadening your criteria or reset the search.
              </p>
              <button
                onClick={resetAllFilters}
                className="px-6 py-2.5 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-8 xl:gap-10">
              <AnimatePresence>
                {filteredAndSortedDesigns.map((design, idx) => {
                  const isLiked = favorites.includes(design._id);
                  const hasValidImage = design.images && design.images.length > 0 && design.images[0]?.url;
                  const displayImg = hasValidImage ? design.images[0].url : null;
                  const isAiConcept = displayImg && displayImg.includes('/images/catalog/');

                  return (
                    <motion.div
                      key={design._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: (idx % 12) * 0.03 }}
                      className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border/80 shadow-xs hover:shadow-2xl hover:border-gold/50 transition-all duration-300"
                    >
                      {/* Image or Branded Placeholder Area */}
                      <Link
                        href={`/designs/${design._id}`}
                        className="block relative aspect-[4/5] w-full overflow-hidden bg-secondary/30"
                      >
                        {displayImg ? (
                          <>
                            <Image
                              src={displayImg}
                              alt={design.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </>
                        ) : (
                          <AtelierImagePlaceholder
                            title={design.name}
                            category={design.category}
                            aspectRatio="aspect-[4/5]"
                          />
                        )}

                        {/* Category Badge Top-Left */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-white/40 text-[10px] sm:text-xs uppercase tracking-wider font-bold text-foreground shadow-sm">
                            {design.category}
                          </span>
                        </div>

                        {/* Wishlist Heart Button Top-Right */}
                        <button
                          onClick={(e) => toggleFavorite(e, design._id)}
                          className={`absolute top-3 right-3 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
                            isLiked
                              ? 'bg-rosewood text-white shadow-md'
                              : 'bg-white/90 text-foreground hover:bg-white hover:text-rosewood'
                          }`}
                          aria-label="Save to Wishlist"
                        >
                          <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? 'fill-current' : ''}`} />
                        </button>

                        {/* Honest Provenance Badge Bottom-Left */}
                        {isAiConcept && (
                          <div className="absolute bottom-3 left-3 z-10">
                            <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 shadow-sm border border-white/10">
                              <Sparkles className="h-3 w-3 text-gold shrink-0" />
                              <span>Design Inspiration / AI Concept</span>
                            </span>
                          </div>
                        )}

                        {/* Quick Personalize CTA on Desktop Hover */}
                        <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <span className="px-3 py-1.5 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold shadow-lg flex items-center gap-1.5">
                            <span>Personalize Fit</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3">
                        <div className="space-y-1">
                          <Link href={`/designs/${design._id}`}>
                            <h3 className="font-serif font-bold text-base sm:text-lg lg:text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {design.name}
                            </h3>
                          </Link>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 font-medium">
                            {design.neckStyle || 'Designer Neck'} • {design.sleeveType || 'Custom Sleeves'}
                          </p>
                        </div>

                        <div className="pt-3 flex items-center justify-between gap-2 border-t border-border/80">
                          <div className="flex flex-col">
                            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                              Tailoring Price
                            </span>
                            <span className="font-sans font-bold text-lg sm:text-xl text-primary">
                              ₹{design.price.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <Link
                            href={`/designs/${design._id}/customize`}
                            className="px-4 py-2 sm:px-5 sm:py-2 rounded-full bg-champagne hover:bg-primary hover:text-white text-primary text-xs sm:text-sm uppercase tracking-wider font-bold text-center transition-all shadow-xs hover:shadow-md flex items-center justify-center min-h-[36px]"
                          >
                            Customize
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function DesignGallery() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-32 min-h-screen bg-background">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }
    >
      <DesignGalleryContent />
    </Suspense>
  );
}
