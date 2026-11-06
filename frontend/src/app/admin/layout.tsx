'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Scissors,
  ShoppingBag,
  Settings,
  Calendar,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/login?redirect=/admin/dashboard');
    }
  }, [loading, user, router]);

  if (loading || !user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Verifying Atelier Admin Studio Credentials...
          </p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Studio Overview' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Fulfillment & Orders' },
    { href: '/admin/appointments', icon: Calendar, label: 'Fitting Appointments' },
    { href: '/admin/quotations', icon: Sparkles, label: 'Design Quotations' },
    { href: '/admin/designs', icon: Scissors, label: 'Manage Silhouettes' },
    { href: '/admin/services', icon: Settings, label: 'Add-on Services' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col flex-shrink-0">
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between md:block space-y-0 md:space-y-1">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gold font-bold">
              Atelier Management
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-foreground">Admin Studio</h2>
          </div>
          <Link
            href="/"
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Store</span>
          </Link>
        </div>
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible p-2 sm:p-3 md:p-4 gap-1.5 md:gap-0 md:space-y-1 scrollbar-none">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:bg-champagne/40 hover:text-primary transition-colors whitespace-nowrap shrink-0"
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="hidden md:block p-4 border-t border-border mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Boutique</span>
          </Link>
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto w-full max-w-full overflow-x-hidden">{children}</div>
    </div>
  );
}
