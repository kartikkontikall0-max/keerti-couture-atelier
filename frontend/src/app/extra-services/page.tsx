'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import API_URL from '@/lib/api';
import { StepHeader } from '@/components/customizer/StepHeader';
import { Check, Sparkles, ArrowRight, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';

interface AtelierService {
  _id: string;
  name: string;
  description: string;
  price: number;
}

const FALLBACK_SERVICES: AtelierService[] = [
  {
    _id: 'svc-piko',
    name: 'Saree Fall & Piko Finishing',
    description: 'Precision hem lock stitching with color-matched cotton fall for fluid drape.',
    price: 150,
  },
  {
    _id: 'svc-tassels',
    name: 'Artisanal Potli & Kundan Latkans',
    description: 'Handcrafted matching fabric drop tassels with delicate pearl accents for tie-back doris.',
    price: 250,
  },
  {
    _id: 'svc-interlining',
    name: 'Dual-Layer Breathable Interlining',
    description: 'Extra stiffened micro-cotton interlining for sheer organza or net blouse stability.',
    price: 180,
  },
  {
    _id: 'svc-express',
    name: 'Express 48-Hour Priority Tailoring',
    description: 'Move your order to the head of our atelier queue with guaranteed 48-hour completion.',
    price: 450,
  },
];

function ExtraServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designId = searchParams.get('designId') || '';

  const [availableServices, setAvailableServices] = useState<AtelierService[]>([]);
  const [selectedServices, setSelectedServices] = useState<AtelierService[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState<any>(null);

  // Load existing order from storage
  useEffect(() => {
    try {
      const order = JSON.parse(localStorage.getItem('currentOrder') || '{}');
      setOrderSummary(order);

      // Pre-select already chosen services if navigating back
      if (order.extraServices && Array.isArray(order.extraServices)) {
        setSelectedServices(order.extraServices);
      }
    } catch {
      // ignore
    }

    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/services`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const activeOnly = res.data.filter((s: any) => s.isActive !== false);
          setAvailableServices(activeOnly.length > 0 ? activeOnly : FALLBACK_SERVICES);
        } else {
          setAvailableServices(FALLBACK_SERVICES);
        }
      } catch (e) {
        setAvailableServices(FALLBACK_SERVICES);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const toggleService = (svc: AtelierService) => {
    const isSelected = selectedServices.some((s) => s._id === svc._id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter((s) => s._id !== svc._id));
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const handleProceed = (includeServices: boolean) => {
    try {
      const order = JSON.parse(localStorage.getItem('currentOrder') || '{}');
      order.extraServices = includeServices
        ? selectedServices.map((s) => ({
            serviceId: s._id,
            name: s.name,
            price: s.price,
          }))
        : [];
      localStorage.setItem('currentOrder', JSON.stringify(order));
    } catch {
      // ignore
    }

    router.push('/checkout');
  };

  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="min-h-screen bg-background">
      <StepHeader
        currentStep={3}
        backHref={designId ? `/designs/${designId}/measurements` : undefined}
        designId={designId}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10 pb-28 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Services List (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
                Step 03 • Complementary Services
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground">
                Enhance Your Couture Order
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add saree finishing, handmade latkans, or express stitching to complete your ensemble in one simple package.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {availableServices.map((svc) => {
                  const isSelected = selectedServices.some((s) => s._id === svc._id);
                  return (
                    <div
                      key={svc._id}
                      onClick={() => toggleService(svc)}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'border-gold bg-champagne/40 shadow-xs ring-2 ring-gold/20'
                          : 'border-border bg-card hover:border-gold/40'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-foreground">
                            {svc.name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            +₹{svc.price}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {svc.description}
                        </p>
                      </div>

                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-primary text-white' : 'border border-border bg-background'
                        }`}
                      >
                        {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Skip or Proceed Direct Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleProceed(false)}
                className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Skip Add-on Services
              </button>

              <button
                type="button"
                onClick={() => handleProceed(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
              >
                <span>Continue to Step 4: Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sticky Atelier Summary Box (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-md space-y-6">
              <div className="space-y-1 pb-4 border-b border-border">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Order In Progress
                </span>
                <h4 className="font-serif font-bold text-foreground text-base">
                  Custom Blouse Tailoring
                </h4>
              </div>

              {/* Selected Addons List */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Selected Add-ons</span>
                  <span className="font-semibold text-foreground">{selectedServices.length} items</span>
                </div>

                {selectedServices.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic py-2">
                    No extra services selected yet.
                  </p>
                ) : (
                  selectedServices.map((s) => (
                    <div key={s._id} className="flex justify-between items-center py-1 text-foreground">
                      <span className="truncate pr-2">{s.name}</span>
                      <span className="font-semibold text-primary flex-shrink-0">+₹{s.price}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Add-on Total
                  </span>
                  <p className="font-serif font-bold text-xl text-primary">
                    ₹{servicesTotal.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground">Calculated at checkout</span>
              </div>

              <button
                type="button"
                onClick={() => handleProceed(true)}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 p-3 bg-background/95 backdrop-blur-md border-t border-border z-40 lg:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Add-on Total</span>
          <span className="font-sans font-bold text-lg text-primary">₹{servicesTotal.toLocaleString('en-IN')}</span>
        </div>
        <button
          type="button"
          onClick={() => handleProceed(true)}
          className="flex-1 max-w-[240px] flex items-center justify-center min-h-[44px] gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 shadow-md active:scale-95 transition-all text-center"
        >
          <span>Step 4: Review & Pay</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ExtraServices() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-32 min-h-screen bg-background">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <ExtraServicesContent />
    </Suspense>
  );
}
