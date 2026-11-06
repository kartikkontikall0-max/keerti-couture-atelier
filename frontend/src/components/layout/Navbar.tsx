'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Menu, X, ChevronDown, Package, Ruler, Heart, ShieldCheck, LogOut, Sparkles, Calendar, FileText } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { name: 'Collection', href: '/designs' },
  { name: 'Categories', href: '/categories' },
  { name: 'Services', href: '/services' },
  { name: 'Measurement Guide', href: '/how-to-measure' },
  { name: 'Contact Boutique', href: '/contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Scroll detection for header backdrop
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setIsAccountDropdownOpen(false);
    router.push('/');
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-gold/15'
            : 'bg-background/80 backdrop-blur-sm border-b border-border/50'
        }`}
      >
        {/* Subtle Gold Accent Bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-6 xl:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-foreground hover:text-primary hover:bg-champagne/40 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Brand Logo & Editorial Wordmark */}
            <div className="flex-shrink-0 flex items-center justify-center lg:justify-start">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-gold/30 shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/images/logo-square.png"
                    alt="Keerti Couture Atelier"
                    fill
                    sizes="(max-width: 640px) 36px, 44px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                    Keerti Couture
                  </span>
                  <span className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans font-medium">
                    Bespoke Atelier • Banhatti
                  </span>
                  <span className="block sm:hidden text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-sans font-medium">
                    Bespoke Atelier
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-3 xl:space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-[11px] xl:text-xs uppercase tracking-[0.12em] xl:tracking-[0.18em] font-medium transition-colors relative py-1 group ${
                      isActive ? 'text-primary font-semibold' : 'text-foreground/80 hover:text-primary'
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute bottom-0 left-0 w-full h-[2px] bg-gold transform origin-left transition-transform duration-300 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: Account & Customizer Direct Action */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Account Dropdown */}
              <div className="relative" ref={dropdownRef}>
                {user ? (
                  <button
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-gold/30 hover:border-gold hover:bg-champagne/30 transition-all text-xs uppercase tracking-wider font-medium text-foreground"
                    aria-expanded={isAccountDropdownOpen}
                  >
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline-block max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs uppercase tracking-wider font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] sm:text-xs">Sign In</span>
                  </Link>
                )}

                {/* Account Menu Popover */}
                <AnimatePresence>
                  {isAccountDropdownOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-xl p-2 z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-border mb-1">
                        <p className="text-xs text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <Link
                          href="/profile?tab=orders"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-champagne/40 hover:text-primary transition-colors"
                        >
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>My Orders & Tracking</span>
                        </Link>
                        <Link
                          href="/profile?tab=appointments"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-champagne/40 hover:text-primary transition-colors"
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fitting Appointments</span>
                        </Link>
                        <Link
                          href="/profile?tab=quotations"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-champagne/40 hover:text-primary transition-colors"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Design Quotations</span>
                        </Link>
                        <Link
                          href="/profile?tab=measurements"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-champagne/40 hover:text-primary transition-colors"
                        >
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <span>Saved Measurements</span>
                        </Link>
                        <Link
                          href="/profile?tab=saved"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-champagne/40 hover:text-primary transition-colors"
                        >
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>Wishlist Designs</span>
                        </Link>
                        {user.isAdmin && (
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span>Atelier Admin Studio</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Start Customizing Direct CTA */}
              <Link
                href="/designs"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-semibold shadow-sm hover:bg-primary/90 hover:shadow-md transition-all active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 text-gold-light" />
                <span>Custom Blouses</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-20 left-0 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-2xl z-50 lg:hidden max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain"
            >
              <div className="px-6 py-6 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center min-h-[44px] px-4 py-3 rounded-lg text-xs uppercase tracking-widest font-semibold transition-colors ${
                      pathname === link.href
                        ? 'bg-champagne/50 text-primary'
                        : 'text-foreground hover:bg-champagne/20'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="border-t border-border pt-4 mt-2 space-y-1">
                  {user ? (
                    <>
                      <div className="px-4 py-2 mb-2 bg-champagne/20 rounded-lg">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Signed in as</p>
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile?tab=orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center min-h-[44px] gap-2.5 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium text-foreground hover:bg-champagne/20"
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                        My Orders & Tracking
                      </Link>
                      <Link
                        href="/profile?tab=appointments"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center min-h-[44px] gap-2.5 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium text-foreground hover:bg-champagne/20"
                      >
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Fitting Appointments
                      </Link>
                      <Link
                        href="/profile?tab=quotations"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center min-h-[44px] gap-2.5 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium text-foreground hover:bg-champagne/20"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Design Quotations
                      </Link>
                      <Link
                        href="/profile?tab=measurements"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center min-h-[44px] gap-2.5 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium text-foreground hover:bg-champagne/20"
                      >
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        Saved Measurements
                      </Link>
                      <Link
                        href="/profile?tab=saved"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center min-h-[44px] gap-2.5 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium text-foreground hover:bg-champagne/20"
                      >
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        Wishlist Designs
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center min-h-[44px] gap-2.5 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-semibold text-primary bg-primary/10 mt-2"
                        >
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          Atelier Admin Studio
                        </Link>
                      )}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center min-h-[44px] gap-2.5 px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-medium text-destructive hover:bg-destructive/10 text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center min-h-[44px] py-2.5 rounded-lg border border-border text-xs uppercase tracking-wider font-semibold text-foreground hover:bg-champagne/20"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center min-h-[44px] py-2.5 rounded-lg bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-primary/90"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
