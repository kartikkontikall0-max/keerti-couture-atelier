'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <section className="bg-champagne/30 border-b border-gold/15 py-14 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
            Data Protection & Client Trust
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground">
            Last updated: November 2026 • Keerti Couture, Banhatti, Karnataka
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">1. Introduction</h2>
          <p>
            At Keerti Couture ("we", "our", "us"), we value your privacy and are committed to protecting the personal data of our customers. This Privacy Policy details the types of information we collect, how it is utilized for bespoke tailoring fulfillment, and the measures we employ to keep your data secure.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Identity & Contact Details:</strong> Name, phone number (for WhatsApp stitching updates), and email address.
            </li>
            <li>
              <strong>Bespoke Sizing & Measurements:</strong> Individual chest, waist, shoulder, armhole, and length dimensions required strictly for pattern cutting.
            </li>
            <li>
              <strong>Customization & Media:</strong> Customer-uploaded saree photos, reference images, and styling notes.
            </li>
            <li>
              <strong>Payment Data:</strong> Transactions are securely processed through Razorpay. Keerti Couture does not view or store your credit card numbers, CVVs, or net banking passwords.
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">3. How Your Data Is Utilized</h2>
          <p>
            We process your information exclusively to fulfill tailoring services, communicate fitting milestones via WhatsApp or email, generate itemized tax receipts, and save your measurements for seamless future repeat orders.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">4. Zero Third-Party Selling or Marketing Spam</h2>
          <p>
            We never sell, rent, or lease your personal information, measurements, or uploaded photos to third-party advertisers or data brokers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">5. Session Security & HttpOnly Cookies</h2>
          <p>
            To protect your account against cross-site scripting (XSS), user authentication tokens are issued in secure, encrypted <code>HttpOnly</code> cookies and never stored in insecure browser localStorage.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <h2 className="font-serif font-bold text-base text-foreground">6. Data Rights & Inquiries</h2>
          <p>
            You have the right to request a copy of your stored tailoring measurements or request account deletion at any time by contacting our atelier concierge at{' '}
            <a href="mailto:keerticouture@gmail.com" className="text-primary underline">
              keerticouture@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
