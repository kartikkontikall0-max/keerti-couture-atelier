'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShieldCheck, HeartHandshake, Scissors, ArrowRight, MapPin } from 'lucide-react';

const pillars = [
  {
    title: 'Individual Bodice Drafting',
    desc: 'We reject generic standardized size charts. Every blouse is hand-drawn and cut to your exact body measurements, accounting for shoulder slopes and bust apex curves.',
  },
  {
    title: 'Authentic Banhatti Craftsmanship',
    desc: 'Rooted in Karnataka’s storied weaving capital, our atelier draws upon generations of master weavers, zari embroiderers, and precision pattern cutters.',
  },
  {
    title: 'Superior Internal Architecture',
    desc: 'True luxury lies on the inside. We use breathable, pre-shrunk micro-cotton interlinings, enclosed seam allowances, and built-in 2-inch alteration margins.',
  },
  {
    title: '7-Day Fit Assurance',
    desc: 'If the delivered fit does not meet your highest expectations, our master artisans adjust it without hesitation, free of charge.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Editorial Header */}
      <section className="bg-champagne/30 border-b border-gold/15 py-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-widest font-bold">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>The Atelier Story</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground">
            The Heritage of Keerti Couture
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Born in the historic textile town of Banhatti, we bring bespoke haute couture blouse craftsmanship to patrons worldwide.
          </p>
        </div>
      </section>

      {/* Main Narrative & Imagery */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
              15+ Years of Bespoke Tailoring
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-tight">
              Where Ancient Zari Artistry Meets Modern Contouring.
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
              <p>
                In Indian festive and bridal wear, the blouse is never an afterthought—it is the focal anchor of the entire saree ensemble. Yet for decades, women have endured frustrating boutique fittings, ill-fitted shoulders, and stiff, uncomfortable linings.
              </p>
              <p>
                Keerti Couture was established in Banhatti to revolutionize custom tailoring. We combine the time-honored techniques of hand zardozi, aari needlework, and fine silk piping with modern digital customization and precision made-to-measure pattern drafting.
              </p>
              <p>
                Whether you are a bride preparing for your Muhurtham silk saree, attending an intimate family sangeet, or curating a capsule festive wardrobe, our master artisans craft each piece with reverence for your individuality.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 relative aspect-[4/5] rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
            <Image
              src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1000"
              alt="Atelier Craftsmanship"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 4 Pillars of Excellence */}
        <div className="space-y-8 pt-8 border-t border-border">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
              Our Principles
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              The Keerti Couture Standard
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => (
              <div
                key={idx}
                className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-3"
              >
                <div className="h-9 w-9 rounded-full bg-champagne text-primary flex items-center justify-center font-serif font-bold text-sm border border-gold/30">
                  0{idx + 1}
                </div>
                <h4 className="font-serif font-bold text-base text-foreground">{p.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Banhatti Atelier Visit Card */}
        <div className="bg-[#1C1613] text-white rounded-3xl p-8 sm:p-12 border border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold-light font-bold">
              Physical Atelier
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Experience the Craft in Person
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Visiting Banhatti? We welcome you to our atelier showroom behind Shivanubhava Mantap to explore fabric swatches, inspect finished zardozi samples, and get fitted in person.
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md flex-shrink-0"
          >
            <span>Visit Atelier or Schedule Call</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
