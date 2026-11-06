'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';

interface StepHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
  backHref?: string;
  designId?: string;
}

const STEPS = [
  { step: 1, label: 'Customize' },
  { step: 2, label: 'Measurements' },
  { step: 3, label: 'Add-on Services' },
  { step: 4, label: 'Review & Pay' },
];

export function StepHeader({ currentStep, backHref, designId }: StepHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between gap-4">
        {/* Back Link */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-primary transition-colors py-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Stepper (Desktop) */}
        <div className="hidden md:flex items-center gap-3 lg:gap-6">
          {STEPS.map((s, idx) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <React.Fragment key={s.step}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-primary text-white'
                        : isCurrent
                        ? 'bg-gold text-white shadow-xs ring-2 ring-gold/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : s.step}
                  </div>
                  <span
                    className={`text-xs uppercase tracking-wider font-semibold transition-colors ${
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-6 lg:w-10 transition-colors ${
                      s.step < currentStep ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Indicator */}
        <div className="flex md:hidden items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Step {currentStep} of 4:
          </span>
          <span className="text-xs font-bold text-primary">
            {STEPS[currentStep - 1].label}
          </span>
        </div>

        {/* Step Badge */}
        <div className="text-right">
          <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider font-medium text-gold">
            Atelier Customizer
          </span>
        </div>
      </div>
    </div>
  );
}

