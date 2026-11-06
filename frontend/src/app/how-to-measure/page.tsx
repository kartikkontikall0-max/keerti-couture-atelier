'use client';

import Link from 'next/link';
import { Ruler, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Video, HelpCircle } from 'lucide-react';

const measurementSteps = [
  {
    step: '01',
    name: 'Bust (Chest) Circumference',
    instruction:
      'Wrap the measuring tape around the fullest part of your bust, keeping the tape parallel to the floor across your back. Do not pull too tight; keep one finger behind the tape for ease.',
    tip: 'Wear the specific bra you plan to wear with your saree blouse for accurate contouring.',
  },
  {
    step: '02',
    name: 'High Waist (Underbust)',
    instruction:
      'Measure around your torso directly below your bust and ribcage where the bottom hem of the blouse will naturally rest.',
    tip: 'Stand straight and breathe normally. This measurement dictates the snugness of your blouse band.',
  },
  {
    step: '03',
    name: 'Shoulder-to-Shoulder Width',
    instruction:
      'Measure across the upper back from the tip of one shoulder bone across to the tip of the other shoulder bone.',
    tip: 'Having a friend assist you is recommended for this measurement to ensure a straight line.',
  },
  {
    step: '04',
    name: 'Sleeve Length & Armhole Round',
    instruction:
      'For length: Measure from your shoulder bone point down along the arm to your desired sleeve hem (e.g. 10.5 in for elbow length). For armhole: Wrap the tape snugly around your armpit joint.',
    tip: 'Bend your elbow slightly while measuring sleeve length to avoid pulling when moving your arms.',
  },
  {
    step: '05',
    name: 'Full Blouse Length',
    instruction:
      'Place the tape at the highest point of your shoulder seam (next to the neck base) and measure vertically down over the bust apex to where you want the blouse to end.',
    tip: 'Standard blouse lengths range between 13.5 to 15.0 inches depending on your torso height.',
  },
  {
    step: '06',
    name: 'Front & Back Neck Depths',
    instruction:
      'Place the tape at your inner shoulder point and measure diagonally down to where you want the front neckline or back cutout to dip.',
    tip: 'Modest front necklines are usually 6.5 – 7.0 inches. Deep back cutouts range from 9.5 – 11.0 inches.',
  },
];

export default function HowToMeasure() {
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Editorial Header */}
      <section className="bg-champagne/30 border-b border-gold/15 py-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-widest font-bold">
            <Ruler className="h-3.5 w-3.5 text-gold" />
            <span>Master Fit Blueprint</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground">
            The Bespoke Measurement Guide
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            A flawless blouse fit begins with precise measurements. Follow our 6-step atelier guidelines using a flexible measuring tape in inches.
          </p>
        </div>
      </section>

      {/* Guide Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-14 space-y-12">
        {/* Quick Golden Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-full bg-champagne flex items-center justify-center text-primary font-bold text-xs border border-gold/30">
              1
            </div>
            <h3 className="font-serif font-bold text-base text-foreground">Use a Flexible Tape</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use a standard tailor’s fiberglass tape. Measure in inches, noting down half-inches (e.g. 34.5 in).
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-full bg-champagne flex items-center justify-center text-primary font-bold text-xs border border-gold/30">
              2
            </div>
            <h3 className="font-serif font-bold text-base text-foreground">Wear Your Preferred Bra</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Always measure while wearing the bra style (padded, non-padded, push-up) you intend to wear with the blouse.
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-2">
            <div className="h-10 w-10 rounded-full bg-champagne flex items-center justify-center text-primary font-bold text-xs border border-gold/30">
              3
            </div>
            <h3 className="font-serif font-bold text-base text-foreground">7-Day Fit Guarantee</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every Keerti Couture blouse includes an interior 2-inch alteration allowance plus complimentary alterations.
            </p>
          </div>
        </div>

        {/* The 6 Steps */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
              Step-by-Step Instructions
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              6 Key Dimensions for Master Pattern Cutting
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {measurementSteps.map((m) => (
              <div
                key={m.step}
                className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-3 hover:border-gold/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl font-bold text-gold/60">{m.step}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-champagne text-primary text-[10px] uppercase tracking-wider font-bold border border-gold/20">
                    Inches (IN)
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg text-foreground">{m.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.instruction}</p>

                <div className="pt-2 border-t border-border flex items-start gap-2 text-[11px] text-foreground font-medium bg-champagne/30 p-3 rounded-xl border border-gold/20">
                  <Sparkles className="h-3.5 w-3.5 text-gold flex-shrink-0 mt-0.5" />
                  <span>Atelier Tip: {m.tip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Assistance Card */}
        <div className="bg-champagne/40 rounded-3xl border border-gold/30 p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto">
          <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center mx-auto shadow-md">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-foreground">
            Prefer a Master Stylist to Guide You?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Book a complimentary 10-minute WhatsApp video call. Our master tailor will walk you through each measurement step live on camera.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="https://wa.me/919945804019?text=Hello%20Keerti%20Couture%2C%20I%20would%20like%20to%20schedule%20a%20video%20measurement%20consultation."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#25D366] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#25D366]/90 transition-all shadow-md"
            >
              <span>Schedule WhatsApp Video Consult</span>
            </a>

            <Link
              href="/designs"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md"
            >
              <span>Ready? Explore Designs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
