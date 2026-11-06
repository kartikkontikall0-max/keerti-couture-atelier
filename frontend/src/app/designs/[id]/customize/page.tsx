'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import axios from 'axios';
import API_URL from '@/lib/api';
import { StepHeader } from '@/components/customizer/StepHeader';
import { CheckCircle2, Sparkles, ArrowRight, Palette } from 'lucide-react';

const COLOR_OPTIONS = [
  { name: 'Couture Rosewood', hex: '#8B2238' },
  { name: 'Muhurtham Crimson', hex: '#A81C2E' },
  { name: 'Antique Gold', hex: '#C5A059' },
  { name: 'Champagne Ivory', hex: '#FAF8F5' },
  { name: 'Royal Navy', hex: '#1B2A4A' },
  { name: 'Emerald Silk', hex: '#1C4A3A' },
  { name: 'Peacock Teal', hex: '#0D5C75' },
  { name: 'Midnight Charcoal', hex: '#232323' },
];

const NECK_STYLES = [
  { id: 'Sweetheart', name: 'Sweetheart Neck', desc: 'Flattering contoured curve, ideal for heavy necklaces' },
  { id: 'Boat Neck', name: 'Royal Boat Neck', desc: 'Wide collarbone silhouette, popular for silk sarees' },
  { id: 'Deep V', name: 'Plunging V-Neck', desc: 'Modern elongated neckline with clean tailored edges' },
  { id: 'Round Neck', name: 'Classic Deep Round', desc: 'Timeless circular cut, versatile for all sarees' },
  { id: 'High Collar', name: 'High Mandarin Collar', desc: 'Regal structured collar with front keyhole accent' },
  { id: 'Square Neck', name: 'Framed Square Neck', desc: 'Crisp geometrical silhouette with shoulder hold' },
];

const SLEEVE_TYPES = [
  { id: 'Elbow Length', name: 'Elbow Length', desc: 'Traditional South Indian bridal length (10-11 in)' },
  { id: 'Cap Sleeves', name: 'Short / Cap Sleeves', desc: 'Crisp 4-5 inch length, perfect for warm festivities' },
  { id: 'Sleeveless', name: 'Sleeveless', desc: 'Clean shoulder line with reinforced armhole binding' },
  { id: 'Full Sleeves', name: 'Full Churidar Sleeves', desc: 'Wrist length with delicate cuff border or embroidery' },
  { id: 'Puff Sleeves', name: 'Traditional Pleated Puff', desc: 'Heritage gathered silk puff with border band' },
];

const BACK_DESIGNS = [
  { id: 'Deep U Back', name: 'Deep U Cutout', desc: 'Classic plunging curve with optional dori tie-up' },
  { id: 'Keyhole', name: 'Teardrop Keyhole', desc: 'Artisanal teardrop opening with top hook accent' },
  { id: 'Tie-Up Dori', name: 'Open Back with Dori', desc: 'Dramatic open back with handcrafted potli latkans' },
  { id: 'Potli Buttons', name: 'Closed with Potli Buttons', desc: 'Regal covered back with hand-stitched potli buttons' },
  { id: 'Sheer Illusion', name: 'Sheer Illusion Net', desc: 'Skin-tone mesh with scattered embroidered pearls' },
  { id: 'Closed Back', name: 'Modest Closed Back', desc: 'Full coverage with concealed center back zipper' },
];

export default function CustomizeBlouse() {
  const params = useParams();
  const router = useRouter();

  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [customization, setCustomization] = useState({
    fabricColor: 'Couture Rosewood',
    neckStyle: 'Sweetheart Neck',
    sleeveType: 'Elbow Length',
    backDesign: 'Deep U Cutout',
    paddingOption: 'With Pads',
    embroideryOption: 'Hand Zardozi Accent',
  });

  // Restore saved customization from previous visit if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('currentOrder');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customization) {
          setCustomization((prev) => ({ ...prev, ...parsed.customization }));
        }
      }
    } catch {
      // ignore
    }

    const fetchDesign = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_URL}/designs/${params.id}`);
        setDesign(data?.design || data);
      } catch (e) {
        console.error('Failed to load design in customizer', e);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDesign();
    }
  }, [params.id]);

  const updateCust = (key: string, val: string) => {
    setCustomization((prev) => ({ ...prev, [key]: val }));
  };

  const handleProceed = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('currentOrder') || '{}');
      const updated = {
        ...existing,
        designId: params.id,
        customization,
      };
      localStorage.setItem('currentOrder', JSON.stringify(updated));
    } catch {
      // ignore
    }

    router.push(`/designs/${params.id}/measurements`);
  };

  const basePrice = design?.price || 0;
  const paddingAddon = customization.paddingOption === 'With Pads' ? 150 : 0;
  const embroideryAddon =
    customization.embroideryOption === 'Hand Zardozi Accent'
      ? 400
      : customization.embroideryOption === 'Aari Thread Embroidery'
      ? 250
      : 0;
  const currentTotal = basePrice + paddingAddon + embroideryAddon;

  return (
    <div className="min-h-screen bg-background">
      {/* 4-Step Progress Header */}
      <StepHeader currentStep={1} backHref={`/designs/${params.id}`} designId={params.id as string} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8 pb-28 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Customization Studio (8 Cols) */}
          <div className="lg:col-span-8 space-y-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
                Step 01 • Silhouette Studio
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mt-1">
                Personalize Your Blouse Details
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Choose your desired neckline, sleeve profile, back opening, and padding preferences. Our artisans will hand-cut the pattern to match your choices.
              </p>
            </div>

            {/* 1. Color Selection */}
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    1. Fabric / Lining Tone
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select the primary hue or matching lining palette for your saree
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-champagne border border-gold/30">
                  {customization.fabricColor}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {COLOR_OPTIONS.map((c) => {
                  const isSelected = customization.fabricColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => updateCust('fabricColor', c.name)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-gold bg-champagne/40 ring-2 ring-gold/30 shadow-xs'
                          : 'border-border hover:border-gold/40 bg-card'
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full border border-black/10 flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-xs font-medium text-foreground truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Front Neckline Style */}
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  2. Front Neckline Silhouette
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select the front neckline shape tailored to complement your jewellery
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {NECK_STYLES.map((neck) => {
                  const isSelected = customization.neckStyle === neck.name;
                  return (
                    <div
                      key={neck.id}
                      onClick={() => updateCust('neckStyle', neck.name)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-gold bg-champagne/40 ring-2 ring-gold/30'
                          : 'border-border hover:border-gold/40 bg-card'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <span className="font-serif font-bold text-sm text-foreground block">
                          {neck.name}
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {neck.desc}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-primary text-white' : 'border border-border'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Sleeve Silhouette */}
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  3. Sleeve Construction
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose your sleeve length and armhole cut
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {SLEEVE_TYPES.map((slv) => {
                  const isSelected = customization.sleeveType === slv.name;
                  return (
                    <div
                      key={slv.id}
                      onClick={() => updateCust('sleeveType', slv.name)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-gold bg-champagne/40 ring-2 ring-gold/30'
                          : 'border-border hover:border-gold/40 bg-card'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <span className="font-serif font-bold text-sm text-foreground block">
                          {slv.name}
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {slv.desc}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-primary text-white' : 'border border-border'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Back Silhouette */}
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  4. Back Design & Cutout
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose the statement back pattern and closure
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {BACK_DESIGNS.map((back) => {
                  const isSelected = customization.backDesign === back.name;
                  return (
                    <div
                      key={back.id}
                      onClick={() => updateCust('backDesign', back.name)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-gold bg-champagne/40 ring-2 ring-gold/30'
                          : 'border-border hover:border-gold/40 bg-card'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <span className="font-serif font-bold text-sm text-foreground block">
                          {back.name}
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {back.desc}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-primary text-white' : 'border border-border'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Padding & Hand Embroidery Accents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Cup Padding */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
                <h3 className="font-serif text-base font-bold text-foreground">
                  Bust Padding Support
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'With Pads', label: 'Molded Cups Inserted (+₹150)' },
                    { id: 'Without Pads', label: 'Without Pads (Classic Lining)' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-medium ${
                        customization.paddingOption === opt.id
                          ? 'border-gold bg-champagne/40 text-foreground font-semibold'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paddingOption"
                        checked={customization.paddingOption === opt.id}
                        onChange={() => updateCust('paddingOption', opt.id)}
                        className="text-primary focus:ring-gold"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Embroidery Addon */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
                <h3 className="font-serif text-base font-bold text-foreground">
                  Embroidery Accents
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'Hand Zardozi Accent', label: 'Zardozi Border Work (+₹400)' },
                    { id: 'Aari Thread Embroidery', label: 'Aari Floral Thread (+₹250)' },
                    { id: 'None', label: 'Standard Fabric Finish (+₹0)' },
                  ].map((emb) => (
                    <label
                      key={emb.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-medium ${
                        customization.embroideryOption === emb.id
                          ? 'border-gold bg-champagne/40 text-foreground font-semibold'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="embroideryOption"
                        checked={customization.embroideryOption === emb.id}
                        onChange={() => updateCust('embroideryOption', emb.id)}
                        className="text-primary focus:ring-gold"
                      />
                      <span>{emb.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Summary Drawer (4 Cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-md space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                {design?.images && design.images[0]?.url && (
                  <div className="relative h-16 w-14 rounded-lg overflow-hidden border border-border flex-shrink-0">
                    <Image src={design.images[0].url} alt={design.name} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Selected Silhouette
                  </span>
                  <h4 className="font-serif font-bold text-foreground text-sm">
                    {design?.name || 'Designer Blouse'}
                  </h4>
                  <span className="text-xs font-semibold text-primary">
                    Base: ₹{basePrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Selections Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Color / Hue</span>
                  <span className="font-semibold text-foreground">{customization.fabricColor}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Neckline</span>
                  <span className="font-semibold text-foreground">{customization.neckStyle}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Sleeves</span>
                  <span className="font-semibold text-foreground">{customization.sleeveType}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Back Cutout</span>
                  <span className="font-semibold text-foreground">{customization.backDesign}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Padding</span>
                  <span className="font-semibold text-foreground">{customization.paddingOption}</span>
                </div>
                {embroideryAddon > 0 && (
                  <div className="flex justify-between items-center py-1 text-primary">
                    <span>Embroidery Accent</span>
                    <span className="font-semibold">+₹{embroideryAddon}</span>
                  </div>
                )}
              </div>

              {/* Total Price Bar */}
              <div className="pt-4 border-t border-border flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Estimated Stitching
                  </span>
                  <p className="font-serif font-bold text-2xl text-primary">
                    ₹{currentTotal.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground">Includes Lining & Tax</span>
              </div>

              {/* Step 2 CTA */}
              <button
                type="button"
                onClick={handleProceed}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95"
              >
                <span>Continue to Step 2: Measurements</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 p-3 bg-background/95 backdrop-blur-md border-t border-border z-40 lg:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Estimated Total</span>
          <span className="font-sans font-bold text-lg text-primary">₹{currentTotal.toLocaleString('en-IN')}</span>
        </div>
        <button
          type="button"
          onClick={handleProceed}
          className="flex-1 max-w-[240px] flex items-center justify-center min-h-[44px] gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 shadow-md active:scale-95 transition-all text-center"
        >
          <span>Step 2: Measurements</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
