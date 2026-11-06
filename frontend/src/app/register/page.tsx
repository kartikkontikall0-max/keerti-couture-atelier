'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { User, Mail, Phone, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/profile';
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, phone);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-widest font-bold">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <span>New Client Registration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
          Join Keerti Couture
        </h1>
        <p className="text-xs text-muted-foreground">
          Create an account to save measurements, customize blouses, and track orders.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card py-8 px-6 sm:px-10 rounded-3xl border border-border shadow-xl space-y-6"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                Phone Number (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  required
                  placeholder="+91 99458 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Atelier Account...' : 'Register Client Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link
                href={`/login${redirectUrl !== '/profile' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="font-semibold text-primary hover:underline ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-32 min-h-[60vh] bg-background">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
