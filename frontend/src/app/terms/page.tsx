'use client';

import Link from 'next/link';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <section className="bg-champagne/30 border-b border-gold/15 py-14 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
            Legal & Atelier Policies
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Terms of Service & Tailoring Agreement
          </h1>
          <p className="text-xs text-muted-foreground">
            Last updated: November 2026 • Keerti Couture, Banhatti, Karnataka
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">1. Bespoke & Made-to-Measure Nature of Goods</h2>
          <p>
            All garments offered through Keerti Couture are individually crafted to the specific measurements and styling selections provided by the customer. Because each piece is drafted, cut, and stitched exclusively for you, standard retail returns for a refund are not permitted.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">2. The 7-Day Perfect Fit Guarantee</h2>
          <p>
            We stand behind the craftsmanship of every garment. If the delivered blouse requires minor sizing adjustments (tightening, loosening, dart adjustment, or hem refinement), Keerti Couture provides complimentary alterations within seven (7) days of delivery or collection. All garments include built-in 2-inch alteration margins.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">3. Order Modifications & Cancellation Window</h2>
          <p>
            Customers may modify measurement details, necklines, or cancel an order while the status remains <strong>"Order Received"</strong>. Once our master tailors begin drafting or pattern cutting (status <strong>"Pattern & Stitching"</strong>), fabric has been allocated and cut, and the order cannot be cancelled or refunded.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">4. Payment Terms & Advance Booking</h2>
          <p>
            For orders booked under the <strong>Advance Deposit</strong> option, the customer pays a non-refundable deposit of ₹300 at checkout to secure queue placement and start tailoring. The remaining balance must be cleared upon boutique pickup or prior to dispatch. For <strong>Pay at Pickup</strong> orders, payment is due upon final fitting inspection at our atelier in Banhatti.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">5. Customer-Supplied Fabric & Reference Images</h2>
          <p>
            When customers upload reference photos or send physical saree fabrics to our atelier, our tailors will match the requested aesthetic as closely as possible. Due to natural textile variations, minor dye batch and zari luster differences may occur.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">6. Turnaround & Dispatch Timelines</h2>
          <p>
            Standard bespoke tailoring requires 5 to 7 business days from measurement confirmation. Priority Express orders are turned around within 48 business hours. Keerti Couture is not liable for carrier delays caused by extreme weather, national holidays, or transit disruptions.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">7. Governing Law & Jurisdiction</h2>
          <p>
            These terms are governed by the laws of India. Any legal dispute or claim arising from tailoring services provided shall be subject to the exclusive jurisdiction of the competent courts in Jamkhandi / Bagalkot District, Karnataka.
          </p>
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/contact"
            className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
          >
            Have Questions About Our Terms? Contact Atelier Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
