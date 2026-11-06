'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { StepHeader } from '@/components/customizer/StepHeader';
import { Ruler, Sparkles, ArrowRight, HelpCircle, AlertCircle, CheckCircle2, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';

interface MeasurementFields {
  bust: string;
  waist: string;
  shoulder: string;
  sleeveLength: string;
  armhole: string;
  blouseLength: string;
  frontNeckDepth: string;
  backNeckDepth: string;
}

export default function Measurements() {
  const params = useParams();
  const router = useRouter();

  const [measurements, setMeasurements] = useState<MeasurementFields>({
    bust: '',
    waist: '',
    shoulder: '',
    sleeveLength: '',
    armhole: '',
    blouseLength: '',
    frontNeckDepth: '',
    backNeckDepth: '',
  });

  const [validationError, setValidationError] = useState('');
  const [loadedSaved, setLoadedSaved] = useState(false);

  // Restore existing measurements if present
  useEffect(() => {
    try {
      const order = JSON.parse(localStorage.getItem('currentOrder') || '{}');
      if (order.measurements) {
        setMeasurements((prev) => ({ ...prev, ...order.measurements }));
      }
    } catch {
      // ignore
    }
  }, []);

  // One-click load saved profile measurements
  const handleLoadSaved = () => {
    try {
      const saved = localStorage.getItem('kc_saved_measurements');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMeasurements((prev) => ({ ...prev, ...parsed }));
        setLoadedSaved(true);
        setTimeout(() => setLoadedSaved(false), 3000);
      } else {
        alert('No saved measurements found in this browser. Fill in below and click "Save for Future Orders".');
      }
    } catch {
      // ignore
    }
  };

  const handleSaveToProfile = () => {
    if (!measurements.bust || !measurements.waist) {
      setValidationError('Please enter at least Bust and High Waist measurements before saving.');
      return;
    }
    try {
      localStorage.setItem('kc_saved_measurements', JSON.stringify(measurements));
      setLoadedSaved(true);
      setTimeout(() => setLoadedSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError('');
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!measurements.bust.trim() || !measurements.waist.trim()) {
      setValidationError('Please provide at least your Bust (Chest) and High Waist measurements.');
      return;
    }

    try {
      const order = JSON.parse(localStorage.getItem('currentOrder') || '{}');
      order.designId = params.id;
      order.measurements = measurements;
      localStorage.setItem('currentOrder', JSON.stringify(order));
    } catch {
      // ignore
    }

    // Direct cleanly to Step 3: Extra Services
    router.push(`/extra-services?designId=${params.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 4-Step Progress Header */}
      <StepHeader
        currentStep={2}
        backHref={`/designs/${params.id}/customize`}
        designId={params.id as string}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-widest font-bold">
            <Ruler className="h-3.5 w-3.5 text-gold" />
            <span>Step 02 • Bespoke Dimensions</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Precision Tailoring Measurements
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Enter your measurements in inches (supporting half-inches e.g. 34.5). For visual assistance, review our{' '}
            <Link href="/how-to-measure" target="_blank" className="text-primary underline font-medium">
              Measurement Guide
            </Link>
            .
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleLoadSaved}
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-[40px] gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-champagne/40 text-xs font-semibold text-foreground transition-colors"
            >
              <BookmarkCheck className="h-3.5 w-3.5 text-gold" />
              <span>Load Saved Measurements</span>
            </button>
            <button
              type="button"
              onClick={handleSaveToProfile}
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-[40px] gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-champagne/40 text-xs font-semibold text-foreground transition-colors"
            >
              <span>Save for Future Orders</span>
            </button>
          </div>

          {loadedSaved && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Measurements saved successfully!</span>
            </div>
          )}
        </div>

        {validationError && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          {/* Section 1: Core Required Measurements */}
          <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  1. Essential Bodice Fit
                </h3>
                <p className="text-xs text-muted-foreground">Required for master pattern drafting</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-rosewood font-bold">
                * Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>Bust (Chest) Circumference *</span>
                  <span className="text-muted-foreground text-[10px]">Inches</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="24"
                    max="60"
                    required
                    name="bust"
                    value={measurements.bust}
                    onChange={handleChange}
                    placeholder="e.g. 34.5"
                    className="w-full h-12 px-4 pr-12 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    IN
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Measure around fullest part of bust wearing your regular padded or daily bra.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>High Waist (Underbust) *</span>
                  <span className="text-muted-foreground text-[10px]">Inches</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="20"
                    max="55"
                    required
                    name="waist"
                    value={measurements.waist}
                    onChange={handleChange}
                    placeholder="e.g. 28.0"
                    className="w-full h-12 px-4 pr-12 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    IN
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Measure snuggly just under your ribcage where the blouse bottom hem sits.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Shoulder & Sleeves */}
          <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold text-foreground">
                2. Shoulder & Sleeve Proportions
              </h3>
              <p className="text-xs text-muted-foreground">Ensures zero shoulder drop and crisp sleeve hang</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>Shoulder Width</span>
                  <span className="text-muted-foreground text-[10px]">IN</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  name="shoulder"
                  value={measurements.shoulder}
                  onChange={handleChange}
                  placeholder="e.g. 14.5"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                />
                <p className="text-[10px] text-muted-foreground">From back shoulder bone to bone.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>Sleeve Length</span>
                  <span className="text-muted-foreground text-[10px]">IN</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  name="sleeveLength"
                  value={measurements.sleeveLength}
                  onChange={handleChange}
                  placeholder="e.g. 10.5"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                />
                <p className="text-[10px] text-muted-foreground">Shoulder tip to desired sleeve hem.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>Armhole Round</span>
                  <span className="text-muted-foreground text-[10px]">IN</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  name="armhole"
                  value={measurements.armhole}
                  onChange={handleChange}
                  placeholder="e.g. 15.0"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                />
                <p className="text-[10px] text-muted-foreground">Circumference around armpit.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Lengths & Neckline Depths */}
          <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold text-foreground">
                3. Blouse Length & Neck Depths
              </h3>
              <p className="text-xs text-muted-foreground">Optional fine-tuning for personalized comfort</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>Full Blouse Length</span>
                  <span className="text-muted-foreground text-[10px]">IN</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  name="blouseLength"
                  value={measurements.blouseLength}
                  onChange={handleChange}
                  placeholder="e.g. 14.0"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                />
                <p className="text-[10px] text-muted-foreground">Shoulder apex down to bottom waist.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>Front Neck Depth</span>
                  <span className="text-muted-foreground text-[10px]">IN</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  name="frontNeckDepth"
                  value={measurements.frontNeckDepth}
                  onChange={handleChange}
                  placeholder="e.g. 7.0"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                />
                <p className="text-[10px] text-muted-foreground">Shoulder seam diagonal to front drop.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground flex justify-between">
                  <span>Back Neck Depth</span>
                  <span className="text-muted-foreground text-[10px]">IN</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  name="backNeckDepth"
                  value={measurements.backNeckDepth}
                  onChange={handleChange}
                  placeholder="e.g. 9.5"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:border-gold"
                />
                <p className="text-[10px] text-muted-foreground">Shoulder seam diagonal to back drop.</p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Unsure about an exact measurement? Our stylist will verify before cutting.
            </p>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <span>Continue to Step 3: Add-on Services</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
