'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_URL from '@/lib/api';
import {
  Package,
  User,
  LogOut,
  Heart,
  CheckCircle2,
  Scissors,
  ShoppingBag,
  Truck,
  Ruler,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  ExternalLink,
  Clock,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AtelierImagePlaceholder } from '@/components/ui/AtelierImagePlaceholder';
import { useAuth } from '@/context/AuthContext';

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  advanceAmount?: number;
  remainingAmount?: number;
  design?: { name: string; images?: { url: string }[]; category?: string };
  customizationOptions?: any;
  measurements?: any;
}

interface FavoriteDesign {
  _id: string;
  name: string;
  category: string;
  price: number;
  images: { url: string }[];
}

interface CustomerAppointment {
  _id: string;
  preferredDate: string;
  timeSlot: string;
  consultType: string;
  status: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
}

interface CustomerQuotation {
  _id: string;
  preferredFabric?: string;
  notes: string;
  referenceImages?: { url: string }[];
  status: string;
  quotedAmount?: number;
  quotedTurnaround?: string;
  adminFeedback?: string;
  customerResponse?: string;
  createdAt: string;
}

const ORDER_STEPS = [
  { key: 'Order received', label: 'Order Received', icon: Package },
  { key: 'Stitching started', label: 'Pattern & Stitching', icon: Scissors },
  { key: 'Stitching completed', label: 'Quality Inspected', icon: CheckCircle2 },
  { key: 'Ready for pickup', label: 'Ready for Dispatch', icon: ShoppingBag },
  { key: 'Delivered', label: 'Delivered / Collected', icon: Truck },
];

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  'Partially Paid': 'bg-blue-100 text-blue-800 border border-blue-200',
  Paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Failed: 'bg-rose-100 text-rose-800 border border-rose-200',
};

function OrderCard({ order }: { order: Order }) {
  const currentStepIdx = ORDER_STEPS.findIndex(
    (s) => s.key.toLowerCase() === (order.status || '').toLowerCase()
  );
  const safeIdx = currentStepIdx === -1 ? 0 : currentStepIdx;

  const paymentStatus = order.paymentStatus || 'Pending';
  const paymentMethod = order.paymentMethod || 'PayAtPickup';
  const paymentBadge =
    paymentMethod === 'PayAtPickup'
      ? 'Pay at Pickup'
      : paymentMethod === 'PayAdvance'
      ? 'Advance Deposit'
      : 'Online Paid';

  const designImg =
    order.design?.images && order.design.images[0]?.url
      ? order.design.images[0].url
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-xs p-4 sm:p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-12 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-secondary/30 flex items-center justify-center">
            {designImg ? (
              <Image src={designImg} alt={order.design?.name || 'Blouse'} fill className="object-cover" />
            ) : (
              <Scissors className="h-5 w-5 text-primary rotate-45" />
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
              {order.design?.category || 'Bespoke Order'}
            </span>
            <h3 className="font-serif font-bold text-base text-foreground">
              {order.design?.name || 'Custom Blouse'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Reference: <span className="font-mono font-semibold">KC-{order._id.slice(-6).toUpperCase()}</span> •{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${
              PAYMENT_STATUS_COLORS[paymentStatus] || 'bg-muted text-foreground'
            }`}
          >
            {paymentStatus}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-champagne text-foreground border border-gold/20">
            {paymentBadge}
          </span>
        </div>
      </div>

      {/* 5-Step Order Progress Stepper */}
      <div className="py-2">
        <div className="relative">
          <div className="absolute top-4 sm:top-5 inset-x-3 sm:inset-x-4 h-0.5 bg-muted z-0" />
          <div
            className="absolute top-4 sm:top-5 left-3 sm:left-4 h-0.5 bg-primary z-0 transition-all duration-700"
            style={{
              width: `calc(${(safeIdx / (ORDER_STEPS.length - 1)) * 100}% - 1.5rem)`,
            }}
          />

          <div className="relative z-10 flex justify-between">
            {ORDER_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isDone = idx < safeIdx;
              const isCurrent = idx === safeIdx;

              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 sm:gap-2 max-w-[65px] sm:max-w-[80px]">
                  <div
                    className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isDone
                        ? 'bg-primary border-primary text-white'
                        : isCurrent
                        ? 'bg-gold border-gold text-white ring-2 sm:ring-4 ring-gold/20 shadow-sm scale-105 sm:scale-110'
                        : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] uppercase tracking-wider text-center leading-tight hidden sm:block ${
                      isCurrent
                        ? 'font-bold text-primary'
                        : isDone
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Price</span>
            <p className="font-sans font-bold text-foreground">₹{order.totalPrice.toLocaleString('en-IN')}</p>
          </div>
          {order.advanceAmount && order.advanceAmount > 0 ? (
            <>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Deposit Paid</span>
                <p className="font-semibold text-emerald-700">₹{order.advanceAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance Due</span>
                <p className="font-semibold text-rosewood">₹{order.remainingAmount?.toLocaleString('en-IN')}</p>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-gold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Current Stage: {ORDER_STEPS[safeIdx].label}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'orders';

  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(activeTabParam);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteDesign[]>([]);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [quotations, setQuotations] = useState<CustomerQuotation[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Saved Measurements State
  const [savedMeasurements, setSavedMeasurements] = useState({
    bust: '',
    waist: '',
    shoulder: '',
    sleeveLength: '',
    armhole: '',
    blouseLength: '',
    frontNeckDepth: '',
    backNeckDepth: '',
  });
  const [measurementSavedToast, setMeasurementSavedToast] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kc_saved_measurements');
      if (stored) setSavedMeasurements(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch Orders, Wishlist, Appointments, and Quotes
  useEffect(() => {
    if (!user) return;

    // 1. Fetch Orders
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const { data } = await axios.get(`${API_URL}/orders/myorders`, { withCredentials: true });
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.response?.status === 401) router.push('/login?redirect=/profile');
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();

    // 2. Fetch Appointments
    const fetchAppointments = async () => {
      try {
        setLoadingAppts(true);
        const { data } = await axios.get(`${API_URL}/appointments/myappointments`, { withCredentials: true });
        setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      } catch (err) {
        console.error('Error fetching appointments', err);
      } finally {
        setLoadingAppts(false);
      }
    };
    fetchAppointments();

    // 3. Fetch Quotations
    const fetchQuotations = async () => {
      try {
        setLoadingQuotes(true);
        const { data } = await axios.get(`${API_URL}/quotations/myquotations`, { withCredentials: true });
        setQuotations(Array.isArray(data.quotations) ? data.quotations : []);
      } catch (err) {
        console.error('Error fetching quotations', err);
      } finally {
        setLoadingQuotes(false);
      }
    };
    fetchQuotations();

    // 4. Load Favorites
    try {
      const favIds: string[] = JSON.parse(localStorage.getItem('favoriteDesigns') || '[]');
      if (favIds.length > 0) {
        axios
          .get(`${API_URL}/designs`)
          .then((res) => {
            if (Array.isArray(res.data)) {
              setFavorites(res.data.filter((d: FavoriteDesign) => favIds.includes(d._id)));
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, [user, router]);

  const handleCancelAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment request?')) {
      try {
        await axios.put(`${API_URL}/appointments/${id}/cancel`, {}, { withCredentials: true });
        const { data } = await axios.get(`${API_URL}/appointments/myappointments`, { withCredentials: true });
        setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  const handleQuoteResponse = async (id: string, response: 'Accepted' | 'Declined') => {
    const promptMsg = response === 'Accepted'
      ? 'Accept this quotation? Our atelier will begin preparing fabric allocations.'
      : 'Decline this quotation?';

    if (window.confirm(promptMsg)) {
      try {
        await axios.put(`${API_URL}/quotations/${id}/respond`, { response }, { withCredentials: true });
        const { data } = await axios.get(`${API_URL}/quotations/myquotations`, { withCredentials: true });
        setQuotations(Array.isArray(data.quotations) ? data.quotations : []);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to submit response');
      }
    }
  };

  const handleSaveMeasurements = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('kc_saved_measurements', JSON.stringify(savedMeasurements));
      setMeasurementSavedToast(true);
      setTimeout(() => setMeasurementSavedToast(false), 3000);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex justify-center items-center py-40 min-h-[60vh] bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 1. PROFILE HEADER BANNER */}
      <section className="bg-champagne/30 border-b border-gold/15 py-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md border-2 border-gold/30">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                Keerti Couture Patron
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                {user?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {user?.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.isAdmin && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs uppercase tracking-wider font-semibold hover:bg-primary/20 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Studio</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-xs uppercase tracking-wider font-semibold text-muted-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 5 Tab Navigation Bar */}
        <div className="max-w-[1400px] mx-auto mt-8 flex items-center gap-4 sm:gap-6 border-b border-border overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap relative ${
              activeTab === 'orders' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Bespoke Orders ({orders.length})</span>
            {activeTab === 'orders' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap relative ${
              activeTab === 'appointments' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Fittings & Appointments ({appointments.length})</span>
            {activeTab === 'appointments' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`pb-3 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap relative ${
              activeTab === 'quotations' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Design Quotations ({quotations.length})</span>
            {activeTab === 'quotations' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <button
            onClick={() => setActiveTab('measurements')}
            className={`pb-3 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap relative ${
              activeTab === 'measurements' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Saved Measurements</span>
            {activeTab === 'measurements' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap relative ${
              activeTab === 'saved' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Wishlist ({favorites.length})</span>
            {activeTab === 'saved' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>
      </section>

      {/* 2. TAB CONTENTS */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {loadingOrders ? (
              <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-border max-w-md mx-auto p-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-champagne text-gold flex items-center justify-center mx-auto border border-gold/30">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground">No Orders Yet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You haven't placed any custom blouse tailoring orders yet. Explore our curated gallery to begin your bespoke journey.
                </p>
                <Link
                  href="/designs"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  <span>Explore Couture Gallery</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {loadingAppts ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-border max-w-md mx-auto p-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-champagne text-primary flex items-center justify-center mx-auto border border-gold/30">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground">No Appointments Booked</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Need an in-store boutique fitting or a WhatsApp video styling session? Schedule an appointment with our master cutters.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  <span>Book Atelier Appointment</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                          {appt.consultType}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${
                            appt.status === 'Confirmed'
                              ? 'bg-green-100 text-green-800'
                              : appt.status === 'Rescheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : appt.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>

                      <div>
                        <p className="font-serif font-bold text-base text-foreground">
                          {new Date(appt.preferredDate).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3.5 w-3.5 text-gold" />
                          <span>{appt.timeSlot}</span>
                        </p>
                      </div>

                      {appt.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl">
                          "{appt.notes}"
                        </p>
                      )}

                      {appt.adminNotes && (
                        <div className="p-2.5 rounded-xl bg-champagne/40 border border-gold/20 text-xs text-foreground">
                          <span className="font-bold text-primary">Atelier Update: </span>
                          <span>{appt.adminNotes}</span>
                        </div>
                      )}
                    </div>

                    {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                      <div className="pt-2 border-t border-border flex justify-end">
                        <button
                          onClick={() => handleCancelAppointment(appt._id)}
                          className="text-xs font-semibold text-rosewood hover:underline"
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DESIGN QUOTATIONS */}
        {activeTab === 'quotations' && (
          <div className="space-y-6">
            {loadingQuotes ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-border max-w-md mx-auto p-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-champagne text-primary flex items-center justify-center mx-auto border border-gold/30">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground">No Quotation Requests</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Have a specific blouse design from Instagram or Pinterest? Submit a reference photo for a custom quote.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  <span>Request Custom Quote</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotations.map((q) => (
                  <div
                    key={q._id}
                    className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                          {q.preferredFabric}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${
                            q.status === 'Accepted'
                              ? 'bg-green-100 text-green-800'
                              : q.status === 'Quoted'
                              ? 'bg-blue-100 text-blue-800'
                              : q.status === 'Declined'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>

                      <p className="text-xs text-foreground leading-relaxed">
                        <strong>Requirements:</strong> "{q.notes}"
                      </p>

                      {q.referenceImages && q.referenceImages.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          {q.referenceImages.map((img, i) => (
                            <a
                              key={i}
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative h-14 w-14 rounded-lg overflow-hidden border border-border inline-block flex-shrink-0"
                            >
                              <Image src={img.url} alt="Reference" fill className="object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Quoted Amount & Master Feedback */}
                      {q.quotedAmount ? (
                        <div className="p-4 rounded-xl bg-champagne/40 border border-gold/30 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              Atelier Quote
                            </span>
                            <span className="font-serif font-bold text-lg text-primary">
                              ₹{q.quotedAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {q.quotedTurnaround && (
                            <p className="text-[11px] text-muted-foreground">
                              Estimated Turnaround: <strong>{q.quotedTurnaround}</strong>
                            </p>
                          )}
                          {q.adminFeedback && (
                            <p className="text-xs text-foreground italic border-t border-gold/20 pt-1.5">
                              "{q.adminFeedback}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Our master cutters are evaluating your design reference. Quote will appear here shortly.
                        </p>
                      )}
                    </div>

                    {/* Customer Action when Quoted */}
                    {q.status === 'Quoted' && (
                      <div className="pt-2 border-t border-border flex items-center gap-3">
                        <button
                          onClick={() => handleQuoteResponse(q._id, 'Accepted')}
                          className="flex-1 py-2 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-primary/90"
                        >
                          Accept Quote
                        </button>
                        <button
                          onClick={() => handleQuoteResponse(q._id, 'Declined')}
                          className="py-2 px-4 rounded-full border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:bg-muted"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SAVED MEASUREMENTS */}
        {activeTab === 'measurements' && (
          <div className="max-w-2xl mx-auto bg-card p-6 sm:p-10 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="space-y-1 pb-4 border-b border-border">
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                Atelier Profile
              </span>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Your Saved Body Measurements
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Save your standard dimensions once. You can preload these measurements during any future blouse customization.
              </p>
            </div>

            {measurementSavedToast && (
              <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Measurements updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveMeasurements} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Bust (Chest) (IN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={savedMeasurements.bust}
                    onChange={(e) =>
                      setSavedMeasurements({ ...savedMeasurements, bust: e.target.value })
                    }
                    placeholder="e.g. 34.5"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    High Waist (IN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={savedMeasurements.waist}
                    onChange={(e) =>
                      setSavedMeasurements({ ...savedMeasurements, waist: e.target.value })
                    }
                    placeholder="e.g. 28.0"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Shoulder Width (IN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={savedMeasurements.shoulder}
                    onChange={(e) =>
                      setSavedMeasurements({ ...savedMeasurements, shoulder: e.target.value })
                    }
                    placeholder="e.g. 14.5"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Sleeve Length (IN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={savedMeasurements.sleeveLength}
                    onChange={(e) =>
                      setSavedMeasurements({ ...savedMeasurements, sleeveLength: e.target.value })
                    }
                    placeholder="e.g. 10.5"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Armhole Round (IN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={savedMeasurements.armhole}
                    onChange={(e) =>
                      setSavedMeasurements({ ...savedMeasurements, armhole: e.target.value })
                    }
                    placeholder="e.g. 15.0"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                    Blouse Length (IN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={savedMeasurements.blouseLength}
                    onChange={(e) =>
                      setSavedMeasurements({ ...savedMeasurements, blouseLength: e.target.value })
                    }
                    placeholder="e.g. 14.0"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-8 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  <span>Save Measurements to Profile</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: WISHLIST */}
        {activeTab === 'saved' && (
          <div>
            {favorites.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-border max-w-md mx-auto p-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-champagne text-rosewood flex items-center justify-center mx-auto border border-gold/30">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground">Wishlist Empty</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You haven't saved any designs yet. Tap the heart icon on any blouse in our gallery to keep it here.
                </p>
                <Link
                  href="/designs"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-xs uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  <span>Browse Blouse Collection</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((fav) => (
                  <div
                    key={fav._id}
                    className="group bg-card rounded-2xl overflow-hidden border border-border shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <Link href={`/designs/${fav._id}`} className="block relative aspect-[4/5] w-full overflow-hidden bg-secondary/30">
                      {fav.images && fav.images[0]?.url ? (
                        <Image
                          src={fav.images[0].url}
                          alt={fav.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <AtelierImagePlaceholder title={fav.name} category={fav.category} aspectRatio="aspect-[4/5]" />
                      )}
                    </Link>
                    <div className="p-4 space-y-2">
                      <h4 className="font-serif font-bold text-sm text-foreground truncate">
                        {fav.name}
                      </h4>
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <span className="font-sans font-bold text-xs text-primary">
                          ₹{fav.price.toLocaleString('en-IN')}
                        </span>
                        <Link
                          href={`/designs/${fav._id}/customize`}
                          className="px-3 py-1 rounded-full bg-champagne text-primary text-[10px] uppercase tracking-wider font-semibold hover:bg-primary hover:text-white transition-colors"
                        >
                          Customize
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-32 min-h-screen bg-background">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
