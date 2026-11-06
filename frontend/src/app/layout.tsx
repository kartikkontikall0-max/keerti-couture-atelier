import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MessageCircle } from 'lucide-react';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: {
    default: 'Keerti Couture | Luxury Bespoke Designer Blouse Atelier',
    template: '%s | Keerti Couture',
  },
  description: 'Exquisite bespoke designer blouse tailoring. Handcrafted silk, heirloom bridal embroidery, precision 7-day fit guarantee, and digital atelier customization in Banhatti.',
  keywords: ['designer blouse', 'bespoke tailoring', 'bridal blouse', 'kanjivaram silk', 'banarasi blouse', 'zardosi embroidery', 'Keerti Couture', 'Banhatti blouse atelier'],
  authors: [{ name: 'Keerti Couture Atelier' }],
  creator: 'Keerti Couture',
  metadataBase: new URL('https://keerticouture.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://keerticouture.com',
    siteName: 'Keerti Couture Atelier',
    title: 'Keerti Couture | Luxury Bespoke Designer Blouse Atelier',
    description: 'Bespoke designer blouse tailoring and bridal couture atelier. Handwoven silk, precision fit guarantee, and custom embroidery.',
    images: [
      {
        url: '/images/catalog/royal_zardosi_bridal.jpg',
        width: 1200,
        height: 800,
        alt: 'Keerti Couture Atelier Bridal Blouse Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Keerti Couture | Luxury Bespoke Designer Blouse Atelier',
    description: 'Bespoke designer blouse tailoring and bridal couture atelier.',
    images: ['/images/catalog/royal_zardosi_bridal.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        suppressHydrationWarning
        className="font-sans antialiased text-foreground bg-background selection:bg-primary/20 selection:text-primary"
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 w-full flex flex-col">
              {children}
            </main>
            <Footer />

            {/* FLOATING WHATSAPP ATELIER CONCIERGE */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 group">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                <p className="text-xs font-medium tracking-wide text-foreground">
                  Need styling advice or custom sizing?
                </p>
              </div>
              <a
                href="https://wa.me/919945804019?text=Hello%20Keerti%20Couture%2C%20I%20would%20like%20to%20inquire%20about%20a%20bespoke%20blouse%20design."
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300 border-2 border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
                aria-label="Chat with Atelier Stylist on WhatsApp"
              >
                <MessageCircle className="h-6 w-6" />
              </a>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
