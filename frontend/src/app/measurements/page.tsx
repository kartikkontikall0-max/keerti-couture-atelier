'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Ruler, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function StandaloneMeasurementsPage() {
  const router = useRouter();

  const [measurements, setMeasurements] = useState({
    bust: '',
    waist: '',
    shoulder: '',
    armhole: '',
    sleeveLength: '',
    blouseLength: '',
    frontNeckDepth: '',
    backNeckDepth: '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orderData = JSON.parse(localStorage.getItem('currentOrder') || '{}');
      orderData.measurements = measurements;
      localStorage.setItem('currentOrder', JSON.stringify(orderData));
      localStorage.setItem('kc_saved_measurements', JSON.stringify(measurements));
      setSavedSuccess(true);
      setTimeout(() => {
        router.push('/extra-services');
      }, 800);
    } catch {
      router.push('/extra-services');
    }
  };

  const fields = [
    { name: 'bust', label: 'Bust (Chest)', help: 'Fullest part of bust' },
    { name: 'waist', label: 'High Waist', help: 'Underbust waistline' },
    { name: 'shoulder', label: 'Shoulder Width', help: 'Bone to bone across back' },
    { name: 'armhole', label: 'Armhole Round', help: 'Circumference around armpit' },
    { name: 'sleeveLength', label: 'Sleeve Length', help: 'Shoulder tip down to hem' },
    { name: 'blouseLength', label: 'Full Length', help: 'Shoulder apex to waist' },
    { name: 'frontNeckDepth', label: 'Front Neck Depth', help: 'Diagonal drop from shoulder' },
    { name: 'backNeckDepth', label: 'Back Neck Depth', help: 'Diagonal drop on back' },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <section className="bg-champagne/30 border-b border-gold/15 py-12 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
            Bespoke Atelier Sizing
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Enter Body Measurements
          </h1>
          <p className="text-xs text-muted-foreground">
            Provide your dimensions for personalized pattern drafting. All measurements in inches.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Form (7 cols) */}
          <div className="lg:col-span-7 bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6">
            <div className="space-y-1 pb-4 border-b border-border">
              <h2 className="font-serif font-bold text-lg text-foreground">
                Bodice Dimensions (Inches)
              </h2>
              <p className="text-xs text-muted-foreground">Supports half-inch increments (e.g. 34.5)</p>
            </div>

            {savedSuccess && (
              <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Measurements recorded! Moving to next step...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div key={f.name} className="space-y-1">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                      <span>{f.label}</span>
                      <span className="text-muted-foreground text-[10px]">IN</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      name={f.name}
                      value={measurements[f.name as keyof typeof measurements]}
                      onChange={handleChange}
                      placeholder="e.g. 34.5"
                      className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                    <p className="text-[10px] text-muted-foreground truncate">{f.help}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-8 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
                >
                  <span>Continue to Add-on Services</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Visual Guidelines (5 cols) */}
          <div className="lg:col-span-5 bg-champagne/40 p-6 sm:p-8 rounded-2xl border border-gold/30 space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Ruler className="h-5 w-5 text-gold" />
              <span>Measurement Guidelines</span>
            </div>

            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
              <Image
                src="https://images.unsplash.com/photo-1598522325746-88abeb7e31b1?auto=format&fit=crop&q=80"
                alt="Measuring Tape"
                fill
                className="object-cover brightness-90"
              />
            </div>

            <ul className="space-y-3 text-xs text-foreground/80 leading-relaxed">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <span>Keep tape comfortably snug, never uncomfortably tight.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <span>Wear your intended daily or bridal bra during measurement.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <span>Every blouse includes built-in 2-inch alteration margins.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/how-to-measure"
                className="text-xs uppercase tracking-wider font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
              >
                <span>Read Full Step-by-Step Guide</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
