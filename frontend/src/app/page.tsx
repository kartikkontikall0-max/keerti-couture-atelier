'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, Scissors, Ruler, Truck, Sparkles, CheckCircle2, ShieldCheck, HeartHandshake } from 'lucide-react';
import Image from 'next/image';

const collections = [
  {
    name: 'Bridal & Muhurtham',
    slug: 'Bridal',
    subtitle: 'Heavy Zardozi, Maggam Work & Kundan Details',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=900',
    count: '18 Silhouettes',
  },
  {
    name: 'Contemporary Cutwork',
    slug: 'Designer',
    subtitle: 'Illusion Backs, Sheer Yokes & Scalloped Borders',
    image: 'https://images.unsplash.com/photo-1583391733958-d25e07fac0ec?auto=format&fit=crop&q=80&w=900',
    count: '24 Silhouettes',
  },
  {
    name: 'Classic Silk & Brocade',
    slug: 'Casual',
    subtitle: 'Pure Kanjeevaram & Banarasi Borders with Contrast Piping',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=900',
    count: '32 Silhouettes',
  },
];

const bespokeSteps = [
  {
    step: '01',
    title: 'Select Silhouette',
    desc: 'Browse our atelier collection of handpicked necklines, back cutouts, and sleeve aesthetics or submit a custom inspiration photo.',
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Personalize Details',
    desc: 'Tailor sleeve length, front depth, cup padding, latkan tie-backs, and hand embroidery motifs to your exact preference.',
    icon: Scissors,
  },
  {
    step: '03',
    title: 'Guided Measurements',
    desc: 'Enter your exact body measurements using our visual guide, or upload photo references of your best-fitting blouse.',
    icon: Ruler,
  },
  {
    step: '04',
    title: 'Master Tailoring & Delivery',
    desc: 'Stitched with double reinforced seams, premium micro-cotton lining, and delivered to your doorstep with our 7-day fit guarantee.',
    icon: Truck,
  },
];

const atelierServices = [
  {
    title: 'Saree Fall & Piko',
    desc: 'Precision micro-stitched piko edge with matching weighted cotton falls for fluid pleating.',
    price: '₹120',
  },
  {
    title: 'Custom Latkan & Tassels',
    desc: 'Hand-crafted fabric potli latkans, kundan pearls, and matching zardozi drops.',
    price: '₹250',
  },
  {
    title: 'Cup Padding & Interlining',
    desc: 'Contoured seamless cup inserts with breathable imported buckram support.',
    price: '₹180',
  },
  {
    title: 'Express 48h Stitching',
    desc: 'Priority atelier queue with guaranteed dispatch within 48 business hours.',
    price: '₹400',
  },
];

const clientDiaries = [
  {
    name: 'Sushmitha Hegde',
    location: 'Bengaluru',
    role: 'Bride (Dec 2025)',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    content:
      'The zardozi peacock embroidery on my Muhurtham blouse was breathtaking. Ordering online usually worries me, but the fit was so snug it required zero alterations!',
    rating: 5,
  },
  {
    name: 'Radhika Kulkarni',
    location: 'Hubballi',
    role: 'Festive Saree Order',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    content:
      'Keerti Couture’s boat neck blouse with the potli button detail has become my go-to piece for family weddings. The lining fabric is soft and exceptionally breathable.',
    rating: 5,
  },
  {
    name: 'Pooja Patil',
    location: 'Belagavi',
    role: 'Custom Bridal Order',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    content:
      'I loved the transparent 4-step builder. I picked my neckline, added padding, entered my measurements, and the delivered blouse fits like a glove.',
    rating: 5,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative min-h-[85vh] lg:min-h-[88vh] flex items-center justify-center overflow-hidden border-b border-gold/15">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=2000"
            alt="Keerti Couture Atelier"
            fill
            className="object-cover object-center brightness-[0.72] scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="max-w-2xl text-white space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-gold/40 text-gold-light text-[11px] uppercase tracking-[0.22em] font-medium">
              <Sparkles className="h-3 w-3 text-gold" />
              <span>Haute Couture Blouse Atelier • Banhatti</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-serif font-bold tracking-tight text-white leading-[1.14]">
              The Art of <br />
              <span className="italic font-normal text-gold-light">Flawless Fit</span> & <br />
              Heirloom Craft.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-xl font-light leading-relaxed font-sans">
              Handcrafted bespoke designer blouses tailored to your unique measurements. Discover authentic zari embroidery, bespoke back cutouts, and couture finishing crafted by master artisans.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <Link
                href="/designs"
                className="inline-flex items-center justify-center min-h-[48px] gap-2 px-8 py-3.5 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-95 group"
              >
                <span>Explore Couture Gallery</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/categories"
                className="inline-flex items-center justify-center min-h-[48px] gap-2 px-8 py-3.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/30 text-xs uppercase tracking-widest font-semibold hover:bg-white/20 transition-all"
              >
                <span>Browse by Silhouette</span>
              </Link>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/15 max-w-lg">
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-gold-light">15+</p>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/70 leading-snug">Years Master Tailoring</p>
              </div>
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-gold-light">100%</p>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/70 leading-snug">Custom Measured</p>
              </div>
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-gold-light">7-Day</p>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/70 leading-snug">Fit Guarantee</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS EDITORIAL GRID */}
      <section className="py-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">
              Curated Silhouettes
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-foreground">
              Signature Atelier Collections
            </h2>
          </div>
          <Link
            href="/designs"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            <span>View All Blouse Designs</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((col, idx) => (
            <motion.div
              key={col.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-border bg-card"
            >
              <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden">
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-widest font-medium">
                    {col.count}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-light font-medium">
                  Atelier Line
                </span>
                <h3 className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-gold-light transition-colors">
                  {col.name}
                </h3>
                <p className="text-xs text-white/75 line-clamp-2 leading-relaxed font-sans">
                  {col.subtitle}
                </p>
                <div className="pt-2">
                  <Link
                    href={`/designs?category=${encodeURIComponent(col.slug)}`}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-gold-light hover:text-white transition-colors"
                  >
                    <span>Explore Silhouettes</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. 4-STEP BESPOKE CUSTOMIZER PROCESS */}
      <section className="py-24 bg-champagne/40 border-y border-gold/15">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">
              The Bespoke Experience
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground">
              How Your Couture Blouse Is Crafted
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We eliminate multiple fitting trips. Order your master-crafted blouse online with complete measurement personalization in four transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bespokeSteps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-3xl font-bold text-gold/60">{item.step}</span>
                  <div className="h-11 w-11 rounded-full bg-champagne flex items-center justify-center text-primary border border-gold/20">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="font-serif text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/designs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              <span>Begin Your Custom Blouse Order</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. ATELIER COMPLEMENTARY SERVICES */}
      <section className="py-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">
              Tailoring Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
              Add-On Finishing & Express Care
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <span>Explore All Tailoring Services</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {atelierServices.map((svc) => (
            <div
              key={svc.title}
              className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between hover:border-gold/40 transition-colors"
            >
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-foreground text-base">{svc.title}</h3>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {svc.price}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{svc.desc}</p>
              </div>

              <Link
                href="/designs"
                className="text-[11px] uppercase tracking-wider font-semibold text-primary hover:underline inline-flex items-center gap-1 pt-2 border-t border-border"
              >
                <span>Select with Blouse</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CRAFTSMANSHIP PROMISE & 7-DAY FIT GUARANTEE */}
      <section className="py-20 bg-[#1C1613] text-[#FAF8F5] relative overflow-hidden border-t border-gold/20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold-light font-medium">
                The Keerti Assurance
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
                Crafted in Banhatti, Designed for Forever.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed font-sans">
                Every blouse undergoes strict quality inspections by our senior master cutters. From hand-pressed interlinings to color-matched bias piping, no detail is left to chance.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-gold/30 space-y-4">
              <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center text-gold-light">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white">7-Day Perfect Fit Guarantee</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                If the fit feels slightly loose or tight, our atelier provides complimentary alterations within 7 days of delivery.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-gold/30 space-y-4">
              <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center text-gold-light">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Direct Tailor Video Consult</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Need guidance measuring at home? Schedule a complimentary WhatsApp video appointment with our master stylist.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold-light hover:underline font-semibold pt-1"
              >
                <span>Book Free Appointment</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLIENT DIARIES / AUTHENTIC REVIEWS */}
      <section className="py-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">
            Client Diaries
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Stories from Our Brides & Patrons
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {clientDiaries.map((client) => (
            <div
              key={client.name}
              className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-gold">
                    {[...Array(client.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-champagne text-muted-foreground border border-gold/20">
                    Demo Client Review
                  </span>
                </div>
                <p className="text-sm text-foreground/80 italic leading-relaxed font-serif">
                  "{client.content}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gold/30">
                  <Image src={client.image} alt={client.name} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-foreground">{client.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{client.role} • {client.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="py-20 bg-champagne/60 border-t border-gold/15">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-6">
          <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-semibold">
            Ready to Begin?
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-foreground max-w-2xl mx-auto">
            Experience Bespoke Tailoring Made For You
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Select your favorite blouse silhouette, customize the accents, and enjoy our master-crafted fit delivered directly to your home.
          </p>
          <div className="pt-2">
            <Link
              href="/designs"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <span>Browse All Blouse Designs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
