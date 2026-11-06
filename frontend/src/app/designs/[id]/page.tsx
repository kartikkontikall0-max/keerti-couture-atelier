'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import API_URL from '@/lib/api';
import { AtelierImagePlaceholder } from '@/components/ui/AtelierImagePlaceholder';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  Share2,
  Ruler,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface Design {
  _id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  neckStyle?: string;
  sleeveType?: string;
  backDesign?: string;
  images: { url: string }[];
}

export default function DesignDetail() {
  const params = useParams();
  const router = useRouter();
  const [design, setDesign] = useState<Design | null>(null);
  const [similarDesigns, setSimilarDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (design) {
      try {
        const likes = JSON.parse(localStorage.getItem('favoriteDesigns') || '[]');
        setIsLiked(likes.includes(design._id));
      } catch {
        // ignore
      }
    }
  }, [design]);

  const toggleLike = () => {
    if (!design) return;
    try {
      const likes = JSON.parse(localStorage.getItem('favoriteDesigns') || '[]');
      let newLikes: string[];
      if (isLiked) {
        newLikes = likes.filter((id: string) => id !== design._id);
      } else {
        newLikes = [...likes, design._id];
      }
      localStorage.setItem('favoriteDesigns', JSON.stringify(newLikes));
      setIsLiked(!isLiked);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${design?.name} | Keerti Couture Atelier`,
          text: `Check out this bespoke blouse design from Keerti Couture!`,
          url: url,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  useEffect(() => {
    const fetchDesignData = async () => {
      try {
        setLoading(true);
        setErrorStatus(null);

        const { data: responseData } = await axios.get(`${API_URL}/designs/${params.id}`);
        const designData = responseData.design || responseData;

        setDesign(designData);
        if (designData.images && designData.images.length > 0) {
          setActiveImage(designData.images[0].url);
        }

        // Fetch similar designs in the same category
        try {
          const { data: allData } = await axios.get(`${API_URL}/designs?category=${encodeURIComponent(designData.category)}`);
          if (Array.isArray(allData)) {
            setSimilarDesigns(allData.filter((d: Design) => d._id !== designData._id).slice(0, 4));
          }
        } catch {
          // ignore similar failure
        }
      } catch (error: any) {
        console.error('Failed to load design:', error);
        setErrorStatus(error.response?.status || 500);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDesignData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40 min-h-[60vh] bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (errorStatus === 404 || !design) {
    return (
      <div className="text-center py-32 px-4 max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-3xl font-serif font-bold text-foreground">Design Not Found</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This bespoke blouse silhouette may have been archived or moved. Please explore our curated gallery for similar designs.
        </p>
        <Link
          href="/designs"
          className="px-6 py-2.5 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-primary/90 transition-all"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  const hasImage = Boolean(activeImage);
  const isAiConcept = activeImage && activeImage.includes('/images/catalog/');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8 pb-28 lg:pb-16">
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
          <Link href="/" className="hover:text-foreground transition-colors shrink-0">
            Atelier
          </Link>
          <span>/</span>
          <Link href="/designs" className="hover:text-foreground transition-colors shrink-0">
            Collections
          </Link>
          <span>/</span>
          <Link
            href={`/designs?category=${encodeURIComponent(design.category)}`}
            className="hover:text-foreground transition-colors shrink-0"
          >
            {design.category}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-none shrink-0">
            {design.name}
          </span>
        </nav>

        {/* 2-COLUMN EDITORIAL PRODUCT DISPLAY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Image Presentation & Thumbnails */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-card border border-border shadow-md">
              {hasImage ? (
                <>
                  <Image
                    src={activeImage}
                    alt={design.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-all duration-300"
                    priority
                  />
                  {isAiConcept && (
                    <div className="absolute bottom-4 left-4 z-10">
                      <span className="px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] sm:text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-md border border-white/10">
                        <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                        <span>Design Inspiration / AI Concept</span>
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <AtelierImagePlaceholder
                  title={design.name}
                  category={design.category}
                  aspectRatio="aspect-[4/5]"
                />
              )}

              {/* Floating Quick Action Buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button
                  onClick={toggleLike}
                  className={`h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all ${
                    isLiked
                      ? 'bg-rosewood text-white'
                      : 'bg-white/80 text-foreground hover:bg-white hover:text-rosewood'
                  }`}
                  aria-label="Save to Wishlist"
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full bg-white/80 text-foreground hover:bg-white hover:text-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all relative"
                  aria-label="Share Design"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Share Toast */}
              {shareCopied && (
                <div className="absolute bottom-4 inset-x-4 mx-auto w-fit px-4 py-2 rounded-full bg-black/80 text-white text-xs font-medium backdrop-blur-md shadow-lg z-20">
                  Link copied to clipboard!
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {design.images && design.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {design.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img.url)}
                    className={`relative h-20 w-16 flex-shrink-0 rounded-xl overflow-hidden border transition-all ${
                      activeImage === img.url
                        ? 'border-gold ring-2 ring-gold/30 opacity-100 scale-95'
                        : 'border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.url} alt={`View ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Tailoring Specs & Customizer Entry */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-[0.2em] font-bold">
                {design.category}
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground tracking-tight">
                {design.name}
              </h1>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-3xl font-sans font-bold text-primary">
                  ₹{design.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Tailoring & Stitching Base Price
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed font-sans border-b border-border pb-6">
              {design.description ||
                'A signature bespoke blouse silhouette crafted by Keerti Couture master artisans. Includes high-grade micro-cotton interlining, reinforced seam margins for lifelong adjustability, and our guaranteed fit policy.'}
            </p>

            {/* Silhouette Specifications Grid */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground flex items-center gap-2">
                <Ruler className="h-4 w-4 text-gold" />
                <span>Silhouette Overview</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Front Neckline
                  </span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                    {design.neckStyle || 'Designer Cut'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Sleeve Silhouette
                  </span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                    {design.sleeveType || 'Standard Length'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Back Pattern
                  </span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                    {design.backDesign || 'Curated Back Cutout'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Fit Construction
                  </span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                    Bespoke Made to Measure
                  </p>
                </div>
              </div>
            </div>

            {/* Atelier Guarantees */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-champagne/40 border border-gold/20">
                <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0" />
                <span className="font-medium text-foreground">7-Day Free Fit Alteration</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-champagne/40 border border-gold/20">
                <Truck className="h-4 w-4 text-gold flex-shrink-0" />
                <span className="font-medium text-foreground">5-7 Days Atelier Dispatch</span>
              </div>
            </div>

            {/* Primary Action Button (Triggers Step 1 Customizer) */}
            <div className="space-y-3 pt-2">
              <Link
                href={`/designs/${design._id}/customize`}
                className="w-full flex items-center justify-center gap-2 py-4 px-8 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <span>Step 1: Customize Neckline & Sleeves</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href={`https://wa.me/919945804019?text=Hello%20Keerti%20Couture%2C%20I%20am%20interested%20in%20customizing%20the%20${encodeURIComponent(
                  design.name
                )}%20(ID:%20${design._id})`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full border border-border bg-card hover:bg-champagne/30 text-foreground text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                <span>Inquire with Atelier Stylist</span>
              </a>
            </div>
          </div>
        </div>

        {/* Similar Designs Recommendation Gallery */}
        {similarDesigns.length > 0 && (
          <section className="mt-24 pt-16 border-t border-border space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
                  Complementary Styles
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                  You May Also Admire
                </h2>
              </div>
              <Link
                href={`/designs?category=${encodeURIComponent(design.category)}`}
                className="text-xs uppercase tracking-wider font-semibold text-primary hover:underline"
              >
                View Category
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {similarDesigns.map((sim) => (
                <Link
                  key={sim._id}
                  href={`/designs/${sim._id}`}
                  className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border shadow-xs hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary/30">
                    {sim.images && sim.images[0]?.url ? (
                      <Image
                        src={sim.images[0].url}
                        alt={sim.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <AtelierImagePlaceholder
                        title={sim.name}
                        category={sim.category}
                        aspectRatio="aspect-[4/5]"
                      />
                    )}
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h4 className="font-serif font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {sim.name}
                    </h4>
                    <p className="font-sans font-semibold text-xs text-primary">
                      ₹{sim.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Mobile Bottom CTA Bar */}
      <div className="fixed bottom-0 inset-x-0 p-3 bg-background/95 backdrop-blur-md border-t border-border z-40 lg:hidden flex items-center justify-between gap-4 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Tailoring Price</span>
          <span className="font-sans font-bold text-lg text-primary">₹{design.price.toLocaleString('en-IN')}</span>
        </div>
        <Link
          href={`/designs/${design._id}/customize`}
          className="flex-1 max-w-[220px] flex items-center justify-center min-h-[44px] gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 shadow-md active:scale-95 transition-all text-center"
        >
          <span>Customize Fit</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
