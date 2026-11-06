'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Calendar,
  Sparkles,
  CheckCircle2,
  Send,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import API_URL from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Contact() {
  const { user } = useAuth();

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    date: '',
    timeSlot: '11:30 AM',
    consultType: 'In-Store Atelier Fitting',
    notes: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Custom Quote State
  const [quoteData, setQuoteData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    preferredFabric: 'Pure Silk / Brocade',
    estimatedBudget: '₹2,500 – ₹5,000',
    notes: '',
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(false);

    try {
      await axios.post(
        `${API_URL}/appointments`,
        {
          customerName: bookingData.name.trim(),
          email: bookingData.email.trim(),
          phone: bookingData.phone.trim(),
          preferredDate: bookingData.date,
          timeSlot: bookingData.timeSlot,
          consultType: bookingData.consultType,
          notes: bookingData.notes,
        },
        { withCredentials: true }
      );

      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(
        err.response?.data?.message || 'Failed to book appointment. Please try another date or slot.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploadingImage(true);
    setQuoteError('');

    try {
      const fileData = new FormData();
      fileData.append('image', e.target.files[0]);

      const res = await axios.post(`${API_URL}/upload/user`, fileData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      setUploadedImage(res.data?.url || res.data?.imageUrl);
    } catch (err: any) {
      setQuoteError('Image upload service unavailable. You can describe your design in the notes.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCustomQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteLoading(true);
    setQuoteError('');
    setQuoteSuccess(false);

    try {
      const images = uploadedImage ? [{ url: uploadedImage }] : [];
      await axios.post(
        `${API_URL}/quotations`,
        {
          customerName: quoteData.name.trim(),
          email: quoteData.email.trim(),
          phone: quoteData.phone.trim(),
          preferredFabric: quoteData.preferredFabric,
          estimatedBudget: quoteData.estimatedBudget,
          notes: quoteData.notes,
          referenceImages: images,
        },
        { withCredentials: true }
      );

      setQuoteSuccess(true);
    } catch (err: any) {
      setQuoteError(err.response?.data?.message || 'Failed to submit design quote request.');
    } finally {
      setQuoteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <section className="bg-champagne/30 border-b border-gold/15 py-14 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne text-primary border border-gold/30 text-[10px] uppercase tracking-widest font-bold">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>Atelier Concierge & Inquiries</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground">
            Connect With Our Atelier
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Schedule a private fitting consultation in Banhatti, inquire about custom bridal embroidery, or chat directly with our master stylists.
          </p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Contact Cards & Map (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6">
              <div className="space-y-1 pb-4 border-b border-border">
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                  Boutique Atelier
                </span>
                <h3 className="font-serif font-bold text-xl text-foreground">
                  Keerti Couture Banhatti
                </h3>
              </div>

              <ul className="space-y-4 text-xs">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-foreground leading-relaxed">
                    Mangalwar Peth, Behind Shivanubhava Mantap,<br />
                    Banhatti, Karnataka — 587311
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gold flex-shrink-0" />
                  <div className="flex flex-col text-foreground font-medium">
                    <a href="tel:+918088179166" className="hover:text-primary transition-colors">
                      +91 80881 79166
                    </a>
                    <a href="tel:+919945804019" className="hover:text-primary transition-colors">
                      +91 99458 04019
                    </a>
                  </div>
                </li>

                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gold flex-shrink-0" />
                  <a
                    href="mailto:keerticouture@gmail.com"
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    keerticouture@gmail.com
                  </a>
                </li>

                <li className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                  <div className="text-foreground">
                    <p className="font-semibold">Monday – Saturday: 10:00 AM – 8:30 PM</p>
                    <p className="text-muted-foreground text-[11px]">Sunday: By Prior Appointment Only</p>
                  </div>
                </li>
              </ul>

              <div className="pt-2">
                <a
                  href="https://wa.me/919945804019?text=Hello%20Keerti%20Couture%2C%20I%20would%20like%20to%20visit%20your%20atelier."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#25D366] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#25D366]/90 transition-all shadow-md"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Instant WhatsApp Chat</span>
                </a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border shadow-xs bg-card aspect-[4/3] relative">
              <iframe
                title="Keerti Couture Atelier Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15291.688225576136!2d75.1111666!3d16.5058889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc769f33b115ff7%3A0x6d90bfb805872856!2sRabkavi%20Banhatti%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                className="w-full h-full border-0 grayscale-[0.3] contrast-[1.1]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Right Column: Real Forms (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Fitting Appointment Form */}
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="h-10 w-10 rounded-full bg-champagne text-primary flex items-center justify-center border border-gold/30">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">
                    Book an Atelier Fitting / Video Consultation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Meet with our master pattern cutters in-person or via WhatsApp video
                  </p>
                </div>
              </div>

              {bookingSuccess && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Appointment Requested Successfully!</span>
                  </div>
                  <p>
                    We have logged your fitting session into our atelier calendar and sent a confirmation to your email. You can track this under your account profile.
                  </p>
                </div>
              )}

              {bookingError && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pooja Patil"
                      value={bookingData.name}
                      onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="pooja@example.com"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 99458 00000"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Time Slot *
                    </label>
                    <select
                      value={bookingData.timeSlot}
                      onChange={(e) => setBookingData({ ...bookingData, timeSlot: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    >
                      <option value="10:00 AM">10:00 AM – Morning</option>
                      <option value="11:30 AM">11:30 AM – Morning</option>
                      <option value="02:00 PM">02:00 PM – Afternoon</option>
                      <option value="03:30 PM">03:30 PM – Afternoon</option>
                      <option value="05:00 PM">05:00 PM – Evening</option>
                      <option value="06:30 PM">06:30 PM – Evening</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Consultation Mode
                  </label>
                  <select
                    value={bookingData.consultType}
                    onChange={(e) => setBookingData({ ...bookingData, consultType: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  >
                    <option value="In-Store Atelier Fitting">In-Store Boutique Fitting (Banhatti)</option>
                    <option value="WhatsApp Video Call">WhatsApp Video Consultation</option>
                    <option value="Bridal Trousseau Planning">Bridal Trousseau Planning</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Garment / Saree Occasion Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about your saree type, festive dates, or preferred necklines..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <span>{bookingLoading ? 'Submitting to Atelier...' : 'Request Atelier Appointment'}</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* 2. Custom Blouse Quote Form */}
            <div className="bg-champagne/30 p-6 sm:p-8 rounded-2xl border border-gold/30 shadow-xs space-y-6">
              <div className="space-y-1 pb-4 border-b border-gold/20">
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                  Bespoke Design Inquiry
                </span>
                <h3 className="font-serif font-bold text-lg text-foreground">
                  Have an Inspiration Design from Instagram or Pinterest?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Send us your specifications. Our head master craftsman will review the embroidery complexity and provide an itemized quote within 2 hours.
                </p>
              </div>

              {quoteSuccess && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Design Reference Received!</span>
                  </div>
                  <p>
                    Our master embroidery specialists are reviewing your requirements. We will prepare your custom quote shortly and notify you via email and account profile.
                  </p>
                </div>
              )}

              {quoteError && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{quoteError}</span>
                </div>
              )}

              <form onSubmit={handleCustomQuoteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Kulkarni"
                      value={quoteData.name}
                      onChange={(e) => setQuoteData({ ...quoteData, name: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="radhika@example.com"
                      value={quoteData.email}
                      onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 99458 00000"
                      value={quoteData.phone}
                      onChange={(e) => setQuoteData({ ...quoteData, phone: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Fabric Material
                    </label>
                    <select
                      value={quoteData.preferredFabric}
                      onChange={(e) => setQuoteData({ ...quoteData, preferredFabric: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    >
                      <option value="Pure Silk / Brocade">Pure Silk / Brocade / Kanjeevaram</option>
                      <option value="Raw Silk / Tussar">Raw Silk / Tussar Silk</option>
                      <option value="Velvet / Organza Sheer">Velvet / Organza Sheer Mesh</option>
                      <option value="Cotton / Chanderi">Pure Cotton / Chanderi</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Estimated Tailoring Budget
                    </label>
                    <select
                      value={quoteData.estimatedBudget}
                      onChange={(e) => setQuoteData({ ...quoteData, estimatedBudget: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                    >
                      <option value="₹1,500 – ₹2,500">₹1,500 – ₹2,500 (Standard Designer)</option>
                      <option value="₹2,500 – ₹5,000">₹2,500 – ₹5,000 (Bridal Zardozi)</option>
                      <option value="₹5,000+">₹5,000+ (Heavy Handcrafted Maggam)</option>
                    </select>
                  </div>
                </div>

                {/* Reference Photo Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Upload Inspiration Image (Optional)
                  </label>
                  {uploadedImage ? (
                    <div className="relative aspect-[16/9] w-full max-w-xs rounded-xl overflow-hidden border border-border">
                      <Image src={uploadedImage} alt="Reference Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rosewood transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 p-3.5 border border-dashed border-border hover:border-gold/60 rounded-xl cursor-pointer bg-card transition-colors">
                      <Upload className="h-5 w-5 text-gold" />
                      <span className="text-xs text-foreground font-medium">
                        {uploadingImage ? 'Uploading reference image...' : 'Click to select Pinterest or Instagram photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Design Notes & Cutout Details *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe back cutout style, sleeve embroidery, piping, or potli button accents..."
                    value={quoteData.notes}
                    onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                    className="w-full p-3 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={quoteLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-8 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <span>{quoteLoading ? 'Sending to Master Cutters...' : 'Submit for Direct Master Quote'}</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
