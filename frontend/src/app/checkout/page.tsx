'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  CreditCard,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  Upload,
  MessageCircle,
  X,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Image as ImageIcon,
  User,
  Scissors,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import API_URL from '@/lib/api';
import { StepHeader } from '@/components/customizer/StepHeader';
import { useAuth } from '@/context/AuthContext';

const ADVANCE_AMOUNT = 300;

interface OrderData {
  designId?: string;
  customization?: any;
  measurements?: any;
  extraServices?: { serviceId: string; name: string; price: number }[];
  customReferenceImage?: { url: string; notes?: string };
}

type PaymentMethod = 'PayOnline' | 'PayAdvance' | 'PayAtPickup';

const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const router = useRouter();
  const { user } = useAuth();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [customRefNotes, setCustomRefNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PayAtPickup');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string; whatsappUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('currentOrder') || 'null');
      if (!data || !data.designId) {
        router.push('/designs');
        return;
      }
      setOrderData(data);
      if (data.customReferenceImage?.notes) {
        setCustomRefNotes(data.customReferenceImage.notes);
      }

      const fetchDesign = async () => {
        try {
          const res = await axios.get(`${API_URL}/designs/${data.designId}`);
          setDesign(res.data?.design || res.data);
        } catch (error) {
          console.error('Error fetching design details', error);
        } finally {
          setLoading(false);
        }
      };
      fetchDesign();
    } catch {
      router.push('/designs');
    }
  }, [router]);

  // Handle Reference Image Upload
  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!user) {
      setErrorMessage('Please sign in to upload reference photos.');
      return;
    }

    try {
      setUploadingRef(true);
      setErrorMessage('');
      const fileData = new FormData();
      fileData.append('image', e.target.files[0]);

      const res = await axios.post(`${API_URL}/upload/user`, fileData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      const newOrderData: OrderData = {
        ...orderData,
        customReferenceImage: { url: res.data.url || res.data.imageUrl, notes: customRefNotes },
      };
      setOrderData(newOrderData);
      localStorage.setItem('currentOrder', JSON.stringify(newOrderData));
    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please sign in again.');
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            'Image upload service currently unavailable. You can also share your photo via WhatsApp.'
        );
      }
    } finally {
      setUploadingRef(false);
    }
  };

  const handleRemoveReferenceImage = () => {
    if (!orderData) return;
    const { customReferenceImage, ...rest } = orderData;
    setOrderData(rest);
    localStorage.setItem('currentOrder', JSON.stringify(rest));
  };

  // Pricing Calculation
  const basePrice = design?.price || 0;
  const paddingAddon = orderData?.customization?.paddingOption === 'With Pads' ? 150 : 0;
  const embroideryAddon =
    orderData?.customization?.embroideryOption === 'Hand Zardozi Accent'
      ? 400
      : orderData?.customization?.embroideryOption === 'Aari Thread Embroidery'
      ? 250
      : 0;
  const extraServicesTotal = (orderData?.extraServices || []).reduce(
    (sum: number, s: any) => sum + s.price,
    0
  );
  const totalPrice = basePrice + paddingAddon + embroideryAddon + extraServicesTotal;

  // Create or Update DB Order
  const createOrderInDB = async (pmMethod: PaymentMethod, advAmt = 0) => {
    const updatedNotes = customRefNotes;
    const updatedRef = orderData?.customReferenceImage
      ? { ...orderData.customReferenceImage, notes: updatedNotes }
      : undefined;

    const payload = {
      orderId: activeOrderId || undefined,
      customerName: user?.name || 'Valued Customer',
      phone: user?.phone || '',
      design: orderData?.designId,
      customizationOptions: orderData?.customization,
      measurements: orderData?.measurements,
      extraServices: orderData?.extraServices,
      customReferenceImage: updatedRef,
      totalPrice,
      paymentMethod: pmMethod,
      advanceAmount: advAmt,
    };

    const { data } = await axios.post(`${API_URL}/orders`, payload, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    if (data?.order?._id) {
      setActiveOrderId(data.order._id);
    }
    return data;
  };

  // Razorpay Gateway
  const handleRazorpayPayment = async (amount: number, isAdvance: boolean) => {
    if (!user) {
      setErrorMessage('Please sign in or create an account to proceed to payment.');
      return;
    }

    setPlacingOrder(true);
    setErrorMessage('');

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        setErrorMessage('Failed to connect to payment gateway. Please check your internet connection.');
        setPlacingOrder(false);
        return;
      }

      // 1. Create Razorpay order on backend
      const { data: rzData } = await axios.post(
        `${API_URL}/payments/create-order`,
        { amount, currency: 'INR' },
        { withCredentials: true }
      );

      // 2. Create pending DB order
      const orderRes = await createOrderInDB(isAdvance ? 'PayAdvance' : 'PayOnline', isAdvance ? amount : 0);
      const orderId = orderRes.order._id;

      // 3. Launch Razorpay modal
      const options = {
        key: rzData.keyId,
        amount: rzData.amount,
        currency: rzData.currency,
        name: 'Keerti Couture Atelier',
        description: `${isAdvance ? 'Advance Booking Deposit' : 'Full Couture Payment'} — ${design?.name}`,
        order_id: rzData.razorpayOrderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || '',
        },
        theme: { color: '#8B2238' },
        handler: async (response: any) => {
          try {
            await axios.post(
              `${API_URL}/payments/verify`,
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId,
                paymentType: isAdvance ? 'advance' : 'full',
              },
              { withCredentials: true }
            );

            localStorage.removeItem('currentOrder');
            setOrderSuccess({ orderId, whatsappUrl: orderRes.whatsappUrl });
          } catch {
            setErrorMessage(
              `Payment captured, but order verification failed. Please contact boutique concierge with ID: ${response.razorpay_payment_id}`
            );
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
          },
        },
      };

      const rz = new (window as any).Razorpay(options);
      rz.on('payment.failed', () => {
        setErrorMessage('Payment was not completed. You can retry or choose Pay at Pickup.');
        setPlacingOrder(false);
      });
      rz.open();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || 'Could not initiate payment. Please try again.'
      );
      setPlacingOrder(false);
    }
  };

  const handlePayAtPickup = async () => {
    if (!user) {
      setErrorMessage('Please sign in or create an account to place your bespoke order.');
      return;
    }

    setPlacingOrder(true);
    setErrorMessage('');

    try {
      const orderRes = await createOrderInDB('PayAtPickup');
      localStorage.removeItem('currentOrder');
      setOrderSuccess({ orderId: orderRes.order._id, whatsappUrl: orderRes.whatsappUrl });
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'PayOnline') {
      handleRazorpayPayment(totalPrice, false);
    } else if (paymentMethod === 'PayAdvance') {
      handleRazorpayPayment(ADVANCE_AMOUNT, true);
    } else {
      handlePayAtPickup();
    }
  };

  // SUCCESS CONFIRMATION MODAL / SCREEN
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl shadow-xl p-8 sm:p-12 max-w-lg w-full text-center border border-border space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-champagne text-primary flex items-center justify-center mx-auto border border-gold/30">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold">
              Order Confirmed
            </span>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Thank You, {user?.name || 'Customer'}!
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your bespoke blouse order has been logged into our atelier schedule. Our master tailor will review your measurements before cutting.
            </p>
          </div>

          <div className="bg-champagne/40 rounded-2xl p-5 text-xs text-left border border-gold/20 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Reference</span>
              <span className="font-mono font-bold text-foreground">
                KC-{orderSuccess.orderId.slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Status</span>
              <span className="font-semibold text-primary">
                {paymentMethod === 'PayOnline'
                  ? 'Paid in Full Online'
                  : paymentMethod === 'PayAdvance'
                  ? `Advance Deposit ₹${ADVANCE_AMOUNT} Paid`
                  : 'Pay at Atelier Pickup'}
              </span>
            </div>
            {paymentMethod === 'PayAdvance' && (
              <div className="flex justify-between items-center pt-2 border-t border-gold/20">
                <span className="text-muted-foreground">Balance Due on Dispatch</span>
                <span className="font-bold text-foreground">₹{totalPrice - ADVANCE_AMOUNT}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={orderSuccess.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-[#25D366] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#25D366]/90 transition-all shadow-md"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Send WhatsApp Order Receipt</span>
            </a>

            <Link
              href="/profile?tab=orders"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full border border-border bg-card hover:bg-champagne/40 text-xs uppercase tracking-wider font-semibold text-foreground transition-colors"
            >
              <span>Track in Account Profile</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StepHeader
        currentStep={4}
        backHref="/extra-services"
        designId={orderData?.designId}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Checkout Column (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
                Step 04 • Finalize & Place Order
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground">
                Review Your Bespoke Order
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Confirm your measurements, add reference photos, and choose your preferred payment option.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center justify-between">
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage('')}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Account Status / Sign In Prompt */}
            {!user ? (
              <div className="p-6 rounded-2xl bg-champagne/50 border border-gold/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-foreground">
                      Sign In Required to Place Order
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Your customization details are safely preserved. Sign in or register to complete checkout.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Link
                    href="/login?redirect=/checkout"
                    className="px-5 py-2 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-primary/90 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register?redirect=/checkout"
                    className="px-5 py-2 rounded-full border border-border bg-card text-foreground text-xs uppercase tracking-wider font-semibold hover:bg-champagne/40 transition-all"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 font-semibold">
                  Authenticated
                </span>
              </div>
            )}

            {/* Reference Saree / Blouse Photo Upload */}
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-gold" />
                  <span>Saree / Reference Inspiration Photo</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Optional: Upload a photo of your saree or an inspiration blouse for color and motif matching.
                </p>
              </div>

              {orderData?.customReferenceImage?.url ? (
                <div className="relative aspect-[16/9] w-full max-w-sm rounded-xl overflow-hidden border border-border bg-muted">
                  <Image
                    src={orderData.customReferenceImage.url}
                    alt="Reference Photo"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={handleRemoveReferenceImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rosewood transition-colors"
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-gold/50 rounded-2xl cursor-pointer bg-champagne/20 transition-colors">
                  <Upload className="h-6 w-6 text-gold mb-2" />
                  <span className="text-xs font-semibold text-foreground">
                    {uploadingRef ? 'Uploading photo...' : 'Click to select reference image'}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    Supports JPEG, PNG, WEBP (Max 10 MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    disabled={uploadingRef}
                    className="hidden"
                  />
                </label>
              )}

              {/* Special Instructions Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                  Special Tailoring Instructions / Notes
                </label>
                <textarea
                  rows={3}
                  value={customRefNotes}
                  onChange={(e) => setCustomRefNotes(e.target.value)}
                  placeholder="e.g., Please match border piping with the green pallu; leave 2-inch extra inner margin."
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Select Payment Option
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose 100% online payment, an advance booking deposit, or pay at pickup
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {/* 1. Full Online Payment */}
                <div
                  onClick={() => setPaymentMethod('PayOnline')}
                  className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 ${
                    paymentMethod === 'PayOnline'
                      ? 'border-gold bg-champagne/40 ring-2 ring-gold/20 shadow-xs'
                      : 'border-border bg-card hover:border-gold/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-sm text-foreground">
                        Pay in Full Online (Razorpay)
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        UPI, Google Pay, PhonePe, Cards, NetBanking
                      </p>
                    </div>
                  </div>
                  <span className="font-sans font-bold text-sm text-primary self-end xs:self-center shrink-0">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 2. Advance Deposit */}
                <div
                  onClick={() => setPaymentMethod('PayAdvance')}
                  className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 ${
                    paymentMethod === 'PayAdvance'
                      ? 'border-gold bg-champagne/40 ring-2 ring-gold/20 shadow-xs'
                      : 'border-border bg-card hover:border-gold/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gold/20 text-gold flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-sm text-foreground">
                        Book with ₹{ADVANCE_AMOUNT} Advance Deposit
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Pay ₹{ADVANCE_AMOUNT} online now to start tailoring, balance upon completion
                      </p>
                    </div>
                  </div>
                  <span className="font-sans font-bold text-sm text-gold self-end xs:self-center shrink-0">
                    ₹{ADVANCE_AMOUNT}
                  </span>
                </div>

                {/* 3. Pay at Pickup */}
                <div
                  onClick={() => setPaymentMethod('PayAtPickup')}
                  className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 ${
                    paymentMethod === 'PayAtPickup'
                      ? 'border-gold bg-champagne/40 ring-2 ring-gold/20 shadow-xs'
                      : 'border-border bg-card hover:border-gold/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-sm text-foreground">
                        Pay at Atelier Pickup (COD)
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Inspect fit at our Banhatti boutique before paying
                      </p>
                    </div>
                  </div>
                  <span className="font-sans font-bold text-sm text-foreground self-end xs:self-center shrink-0">
                    Cash / UPI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sticky Order Summary (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-36 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="relative h-20 w-16 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-secondary/30 flex items-center justify-center">
                  {design?.images && design.images[0]?.url ? (
                    <Image src={design.images[0].url} alt={design.name} fill className="object-cover" />
                  ) : (
                    <Scissors className="h-6 w-6 text-primary rotate-45" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                    {design?.category}
                  </span>
                  <h3 className="font-serif font-bold text-foreground text-base">
                    {design?.name || 'Bespoke Blouse'}
                  </h3>
                  <p className="text-xs font-semibold text-primary">
                    Stitching Base: ₹{basePrice.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customization Summary */}
              <div className="space-y-2.5 text-xs pb-4 border-b border-border">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block mb-1">
                  Customization Specifications
                </span>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color / Hue:</span>
                  <span className="font-medium text-foreground">
                    {orderData?.customization?.fabricColor || 'Default'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Neckline:</span>
                  <span className="font-medium text-foreground">
                    {orderData?.customization?.neckStyle || 'Round'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sleeve Silhouette:</span>
                  <span className="font-medium text-foreground">
                    {orderData?.customization?.sleeveType || 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Back Cutout:</span>
                  <span className="font-medium text-foreground">
                    {orderData?.customization?.backDesign || 'Deep'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bust Padding:</span>
                  <span className="font-medium text-foreground">
                    {orderData?.customization?.paddingOption || 'Standard'}
                  </span>
                </div>
              </div>

              {/* Measurements Snapshot */}
              <div className="space-y-2.5 text-xs pb-4 border-b border-border">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block mb-1">
                  Key Dimensions
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Bust: </span>
                    <span className="font-semibold">{orderData?.measurements?.bust || '—'} in</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Waist: </span>
                    <span className="font-semibold">{orderData?.measurements?.waist || '—'} in</span>
                  </div>
                  {orderData?.measurements?.shoulder && (
                    <div>
                      <span className="text-muted-foreground">Shoulder: </span>
                      <span className="font-semibold">{orderData.measurements.shoulder} in</span>
                    </div>
                  )}
                  {orderData?.measurements?.sleeveLength && (
                    <div>
                      <span className="text-muted-foreground">Sleeve: </span>
                      <span className="font-semibold">{orderData.measurements.sleeveLength} in</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add-ons & Extra Services */}
              {orderData?.extraServices && orderData.extraServices.length > 0 && (
                <div className="space-y-2 text-xs pb-4 border-b border-border">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground block mb-1">
                    Add-on Tailoring Services
                  </span>
                  {orderData.extraServices.map((s) => (
                    <div key={s.serviceId} className="flex justify-between text-foreground">
                      <span>{s.name}</span>
                      <span className="font-semibold text-primary">+₹{s.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pricing Totals */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Tailoring</span>
                  <span>₹{basePrice}</span>
                </div>
                {paddingAddon > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Molded Padding</span>
                    <span>+₹{paddingAddon}</span>
                  </div>
                )}
                {embroideryAddon > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Embroidery Accent</span>
                    <span>+₹{embroideryAddon}</span>
                  </div>
                )}
                {extraServicesTotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Extra Services</span>
                    <span>+₹{extraServicesTotal}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex items-baseline justify-between">
                  <span className="font-serif font-bold text-base text-foreground">
                    Total Tailoring Price
                  </span>
                  <span className="font-sans font-bold text-2xl text-primary">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={placingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {placingOrder
                      ? 'Processing Atelier Order...'
                      : paymentMethod === 'PayOnline'
                      ? `Pay ₹${totalPrice.toLocaleString('en-IN')} Online`
                      : paymentMethod === 'PayAdvance'
                      ? `Pay ₹${ADVANCE_AMOUNT} Deposit`
                      : 'Confirm Order (Pay at Pickup)'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                <span>Protected by 7-Day Perfect Fit Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
