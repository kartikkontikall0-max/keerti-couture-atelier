import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1C1613] text-[#FAF8F5] pt-20 pb-12 border-t border-gold/20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-white/10">
          {/* Brand & Craftsmanship */}
          <div className="lg:col-span-2 space-y-5">
            <div className="space-y-1">
              <span className="font-serif text-3xl font-bold tracking-tight text-gold-light block">
                Keerti Couture
              </span>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold/80 font-sans">
                Haute Couture Blouse Atelier
              </p>
            </div>
            
            <p className="text-sm text-white/70 leading-relaxed max-w-md font-sans">
              Handcrafting bespoke designer blouses for South Indian brides, festive celebrations, and heirloom occasions. Every stitch is precision-tailored to your unique measurements with our signature 7-day fit guarantee.
            </p>

            <div className="pt-2 flex flex-wrap gap-3 text-xs text-gold-light/90">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/20">
                <Sparkles className="h-3 w-3 text-gold" />
                Hand-Guided Zardozi & Aari
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/20">
                <ShieldCheck className="h-3 w-3 text-gold" />
                Perfect Fit Guarantee
              </span>
            </div>
          </div>

          {/* Couture Collections */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              Bespoke Collections
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <Link href="/designs" className="hover:text-gold-light transition-colors">
                  All Blouse Silhouettes
                </Link>
              </li>
              <li>
                <Link href="/designs?category=Bridal" className="hover:text-gold-light transition-colors">
                  Bridal & Muhurtham
                </Link>
              </li>
              <li>
                <Link href="/designs?category=Designer" className="hover:text-gold-light transition-colors">
                  Designer Cutwork & Sheer
                </Link>
              </li>
              <li>
                <Link href="/designs?category=Casual" className="hover:text-gold-light transition-colors">
                  Classic Everyday Silk
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-gold-light transition-colors">
                  Explore by Silhouette
                </Link>
              </li>
            </ul>
          </div>

          {/* Atelier Services & Guides */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              Atelier Services
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <Link href="/services" className="hover:text-gold-light transition-colors">
                  Custom Tailoring & Piko
                </Link>
              </li>
              <li>
                <Link href="/how-to-measure" className="hover:text-gold-light transition-colors">
                  Step-by-Step Measurement Guide
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gold-light transition-colors">
                  The Banhatti Craft Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold-light transition-colors">
                  Book Boutique Consultation
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gold-light transition-colors">
                  Tailoring & Return Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Physical Atelier Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              Visit The Atelier
            </h3>
            <ul className="space-y-3.5 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gold flex-shrink-0 mt-1" />
                <span>
                  Mangalwar Peth, Behind Shivanubhava Mantap,<br />
                  Banhatti, Karnataka — 587311
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold flex-shrink-0" />
                <div className="flex flex-col">
                  <a href="tel:+918088179166" className="hover:text-gold-light transition-colors">+91 80881 79166</a>
                  <a href="tel:+919945804019" className="hover:text-gold-light transition-colors">+91 99458 04019</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gold flex-shrink-0" />
                <a href="mailto:keerticouture@gmail.com" className="hover:text-gold-light transition-colors">
                  keerticouture@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Mon – Sat: 10:00 AM – 8:30 PM</span>
              </li>
              <li className="pt-2">
                <a
                  href="https://wa.me/919945804019?text=Hello%20Keerti%20Couture%2C%20I%20would%20like%20to%20visit%20your%20atelier."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/30 transition-colors text-xs font-medium"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp Atelier Stylist</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Keerti Couture. All rights reserved. Handcrafted in India.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Atelier Concierge</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
