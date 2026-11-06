'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, MessageSquare, Check, X, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import API_URL from '@/lib/api';

interface QuotationItem {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  preferredFabric?: string;
  estimatedBudget?: string;
  notes: string;
  referenceImages?: { url: string }[];
  status: 'Submitted' | 'Under Review' | 'Quoted' | 'Accepted' | 'Declined' | 'Closed';
  quotedAmount?: number;
  quotedTurnaround?: string;
  adminFeedback?: string;
  customerResponse?: string;
  createdAt: string;
}

export default function AdminQuotations() {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Quote modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<QuotationItem | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    quotedAmount: '',
    quotedTurnaround: '7-10 Business Days',
    adminFeedback: '',
  });
  const [quoteError, setQuoteError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/quotations`, {
        withCredentials: true,
      });
      setQuotations(Array.isArray(data.quotations) ? data.quotations : []);
    } catch (error) {
      console.error('Error fetching quotations', error);
    } finally {
      setLoading(false);
    }
  };

  const openQuoteModal = (q: QuotationItem) => {
    setActiveQuote(q);
    setQuoteForm({
      quotedAmount: q.quotedAmount ? q.quotedAmount.toString() : '',
      quotedTurnaround: q.quotedTurnaround || '7-10 Business Days',
      adminFeedback: q.adminFeedback || '',
    });
    setQuoteError('');
    setQuoteModalOpen(true);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;

    const amount = Number(quoteForm.quotedAmount);
    if (isNaN(amount) || amount <= 0) {
      setQuoteError('Please enter a valid positive quote amount');
      return;
    }

    setSaving(true);
    setQuoteError('');
    try {
      await axios.put(
        `${API_URL}/quotations/${activeQuote._id}/quote`,
        {
          quotedAmount: amount,
          quotedTurnaround: quoteForm.quotedTurnaround.trim(),
          adminFeedback: quoteForm.adminFeedback.trim(),
          status: 'Quoted',
        },
        { withCredentials: true }
      );
      setQuoteModalOpen(false);
      fetchQuotations();
    } catch (err: any) {
      setQuoteError(err.response?.data?.message || 'Failed to submit quote');
    } finally {
      setSaving(false);
    }
  };

  const filtered = quotations.filter((q) => {
    if (filterStatus === 'All') return true;
    return q.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
            Custom Couture Inquiries
          </span>
          <h1 className="text-3xl font-bold font-serif text-foreground">Design Quotations</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground outline-none"
          >
            <option value="All">All Inquiries ({quotations.length})</option>
            <option value="Submitted">New Submissions</option>
            <option value="Quoted">Quote Sent</option>
            <option value="Accepted">Accepted by Customer</option>
            <option value="Declined">Declined</option>
          </select>

          <button
            onClick={fetchQuotations}
            className="p-2.5 rounded-xl border border-border hover:bg-champagne/40 text-foreground transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border p-8">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-foreground">No Quotation Requests</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Custom design inquiries submitted via the Contact page will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
            <thead className="text-[10px] uppercase tracking-wider bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Fabric & Budget</th>
                <th className="px-6 py-4">Design Notes & Reference</th>
                <th className="px-6 py-4">Quoted Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filtered.map((quote) => (
                <tr key={quote._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{quote.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{quote.phone}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{quote.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{quote.preferredFabric}</p>
                    <p className="text-[11px] text-muted-foreground">{quote.estimatedBudget || 'Flexible'}</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-foreground line-clamp-2 leading-relaxed">{quote.notes}</p>
                    {quote.referenceImages && quote.referenceImages.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {quote.referenceImages.slice(0, 3).map((img, i) => (
                          <a
                            key={i}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative h-10 w-10 rounded-lg overflow-hidden border border-border inline-block flex-shrink-0"
                          >
                            <Image src={img.url} alt="Ref" fill className="object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {quote.quotedAmount ? (
                      <div>
                        <p className="font-bold text-primary font-sans">
                          ₹{quote.quotedAmount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{quote.quotedTurnaround}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">Pending Quote</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        quote.status === 'Accepted'
                          ? 'bg-green-100 text-green-800'
                          : quote.status === 'Quoted'
                          ? 'bg-blue-100 text-blue-800'
                          : quote.status === 'Declined'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openQuoteModal(quote)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold text-[10px] uppercase tracking-wider hover:bg-primary/90 transition-all"
                    >
                      {quote.quotedAmount ? 'Update Quote' : 'Provide Quote'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Provide Quote Modal */}
      {quoteModalOpen && activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-foreground">
                Prepare Master Tailor Quote
              </h3>
              <button
                onClick={() => setQuoteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quoteError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{quoteError}</span>
              </div>
            )}

            <form onSubmit={handleQuoteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1 bg-champagne/30 p-3 rounded-xl border border-gold/20">
                <p className="font-semibold text-foreground">Client: {activeQuote.customerName}</p>
                <p className="text-muted-foreground">Fabric: {activeQuote.preferredFabric}</p>
                <p className="text-foreground italic mt-1 line-clamp-2">"{activeQuote.notes}"</p>
              </div>

              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  Estimated Tailoring Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  placeholder="e.g. 3500"
                  value={quoteForm.quotedAmount}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quotedAmount: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  Estimated Atelier Turnaround
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7-10 Business Days"
                  value={quoteForm.quotedTurnaround}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quotedTurnaround: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  Master Tailor Notes to Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Price includes heavy gold aari embroidery on sleeves, micro-cotton lining, and customized potli tassels..."
                  value={quoteForm.adminFeedback}
                  onChange={(e) => setQuoteForm({ ...quoteForm, adminFeedback: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Transmitting...' : 'Send Quote to Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

