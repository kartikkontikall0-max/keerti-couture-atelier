'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Scissors, CheckCircle2, ShieldCheck, Clock, ArrowRight, Truck } from 'lucide-react';

const services = [
  {
    title: 'Bespoke Blouse Tailoring',
    subtitle: 'Our Signature Heritage Craft',
    price: 'From ₹1,200',
    turnaround: '5 – 7 Business Days',
    desc: 'Pattern drafting strictly based on your individual body contours. Includes premium micro-cotton breathable lining, reinforced stress seams, and interior 2-inch alteration margins.',
    features: [
      'Custom front neckline & sleeve length',
      'Statement back cutouts (deep U, teardrop, sheer mesh)',
      'Contoured princess cut or 4-tuck darting',
      'Complimentary 7-day fit adjustment guarantee',
    ],
    ctaHref: '/designs',
    ctaText: 'Explore Silhouettes',
  },
  {
    title: 'Bridal Aari & Zardozi Handwork',
    subtitle: 'Heirloom Muhurtham Embroidery',
    price: 'From ₹2,800',
    turnaround: '10 – 14 Business Days',
    desc: 'Master artisans handcraft traditional gold zari, French knot silk florals, and Kundan stone borders matching your bridal saree pallu motifs.',
    features: [
      'Authentic metallic zari wire & dabka embroidery',
      'Custom peacock, floral vine, or elephant motifs',
      'Dual-layer buckram stabilization for heavy handwork',
      'Dedicated stylist video consultation included',
    ],
    ctaHref: '/contact',
    ctaText: 'Inquire Bridal Work',
  },
  {
    title: 'Saree Fall & Micro-Piko Finishing',
    subtitle: 'Essential Saree Drape Prep',
    price: '₹150',
    turnaround: '24 – 48 Hours',
    desc: 'Fluid pleat drape achieved through color-matched, pre-shrunk cotton falls and invisible hem lock stitching.',
    features: [
      'Pre-washed pure cotton fall material',
      'Clean high-density zigzag piko hem edge',
      'Zero puckering along delicate chiffon or silk borders',
    ],
    ctaHref: '/designs',
    ctaText: 'Add to Blouse Order',
  },
  {
    title: 'Artisanal Latkans & Potli Drops',
    subtitle: 'Hand-Crafted Tie-Back Accents',
    price: '₹250',
    turnaround: 'Included with Blouse',
    desc: 'Handmade fabric baubles, pearl clusters, and matching zari potli tassels designed specifically for back dori tie-backs.',
    features: [
      'Matching fabric remnants from your blouse cut',
      'Kundan pearl drops and gold bead tassels',
      'Reinforced loop stitching that resists pulling',
    ],
    ctaHref: '/designs',
    ctaText: 'Select in Customizer',
  },
  {
    title: 'Express 48-Hour Tailoring Queue',
    subtitle: 'Priority Atelier Fast-Track',
    price: '₹450 Add-on',
    turnaround: 'Guaranteed 48 Hours',
    desc: 'Emergency stitching for upcoming festive celebrations or unexpected wedding invitations with dedicated master cut.',
    features: [
      'Top priority queue placement in Banhatti workshop',
      'Direct WhatsApp status updates as work progresses',
      'Fast-track dispatched via express courier',
    ],
    ctaHref: '/designs',
    ctaText: 'Select at Checkout',
  },
  {
    title: 'Boutique Alterations & Restyling',
    subtitle: 'Perfect Your Existing Wardrobe',
    price: 'From ₹300',
    turnaround: '2 – 3 Business Days',
    desc: 'Bring or send your ill-fitting blouses for neckline tightening, shoulder dart adjustment, or cup pad retrofitting.',
    features: [
      'Shoulder drop corrections and armhole loosening',
      'Adding cup padding or side zipper insertions',
      'Border replacement and hem extensions',
    ],
    ctaHref: '/contact',
    ctaText: 'Book Alteration',
  },
];

export default function Services() {
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Editorial Header */}
      <section className="bg-champagne/30 border-b border-gold/15 py-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-widest font-bold">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>Master Atelier Craft</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground">
            Bespoke Tailoring & Couture Services
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            From precision-fitted blouse patterns to hand-guided bridal zardozi embroidery and saree finishing, explore our complete atelier offering.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, idx) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              className="bg-card rounded-2xl border border-border p-8 shadow-xs hover:shadow-xl hover:border-gold/40 transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                      {svc.subtitle}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-foreground">
                      {svc.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-champagne text-primary font-bold text-xs flex-shrink-0 border border-gold/30">
                    {svc.price}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {svc.desc}
                </p>

                <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-gold" />
                  <span>Turnaround: {svc.turnaround}</span>
                </div>

                <ul className="space-y-2 pt-2 border-t border-border text-xs text-foreground/85">
                  {svc.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-border">
                <Link
                  href={svc.ctaHref}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-primary/90 transition-all shadow-xs"
                >
                  <span>{svc.ctaText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
