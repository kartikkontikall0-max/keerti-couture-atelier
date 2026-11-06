'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, X, Send } from 'lucide-react';
import API_URL from '@/lib/api';

interface AppointmentItem {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  preferredDate: string;
  timeSlot: string;
  consultType: string;
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Rescheduled' | 'Completed' | 'Cancelled';
  adminNotes?: string;
  createdAt: string;
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Reschedule Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<AppointmentItem | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    preferredDate: '',
    timeSlot: '11:00 AM',
    adminNotes: '',
  });
  const [rescheduleError, setRescheduleError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/appointments`, {
        withCredentials: true,
      });
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch (error) {
      console.error('Error fetching appointments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await axios.put(
        `${API_URL}/appointments/${id}/status`,
        { status, adminNotes: notes },
        { withCredentials: true }
      );
      fetchAppointments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const openRescheduleModal = (appt: AppointmentItem) => {
    setActiveAppointment(appt);
    setRescheduleData({
      preferredDate: new Date(appt.preferredDate).toISOString().split('T')[0],
      timeSlot: appt.timeSlot || '11:00 AM',
      adminNotes: '',
    });
    setRescheduleError('');
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment) return;

    setRescheduleError('');
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/appointments/${activeAppointment._id}/reschedule`,
        rescheduleData,
        { withCredentials: true }
      );
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      setRescheduleError(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setSaving(false);
    }
  };

  const filtered = appointments.filter((a) => {
    if (filterStatus === 'All') return true;
    return a.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
            Atelier Calendar
          </span>
          <h1 className="text-3xl font-bold font-serif text-foreground">Fitting Appointments</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground outline-none"
          >
            <option value="All">All Appointments ({appointments.length})</option>
            <option value="Pending">Pending Review</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            onClick={fetchAppointments}
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
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-foreground">No Appointments</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Customer appointment booking requests will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
            <thead className="text-[10px] uppercase tracking-wider bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Requested Date & Time</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filtered.map((appt) => (
                <tr key={appt._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{appt.customerName}</p>
                    <p className="text-[11px] text-muted-foreground">{appt.phone}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{appt.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-champagne text-primary text-[10px] font-bold">
                      {appt.consultType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">
                      {new Date(appt.preferredDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{appt.timeSlot}</span>
                    </p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                    {appt.notes || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        appt.status === 'Confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appt.status === 'Rescheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : appt.status === 'Completed'
                          ? 'bg-purple-100 text-purple-800'
                          : appt.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {appt.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'Confirmed')}
                          className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-semibold text-[10px] uppercase tracking-wider"
                        >
                          Confirm
                        </button>
                      )}
                      {(appt.status === 'Pending' || appt.status === 'Confirmed') && (
                        <button
                          onClick={() => openRescheduleModal(appt)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[10px] uppercase tracking-wider"
                        >
                          Reschedule
                        </button>
                      )}
                      {appt.status === 'Confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'Completed')}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-[10px] uppercase tracking-wider"
                        >
                          Completed
                        </button>
                      )}
                      {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'Cancelled', 'Cancelled by atelier')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[10px] uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && activeAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-foreground">
                Reschedule Appointment
              </h3>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Client: {activeAppointment.customerName}</p>
                <p className="text-muted-foreground">{activeAppointment.consultType}</p>
              </div>

              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  New Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleData.preferredDate}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, preferredDate: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  New Time Slot *
                </label>
                <select
                  value={rescheduleData.timeSlot}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, timeSlot: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                >
                  <option value="10:00 AM">10:00 AM – Morning Session</option>
                  <option value="11:30 AM">11:30 AM – Morning Session</option>
                  <option value="02:00 PM">02:00 PM – Afternoon Session</option>
                  <option value="03:30 PM">03:30 PM – Afternoon Session</option>
                  <option value="05:00 PM">05:00 PM – Evening Fitting</option>
                  <option value="06:30 PM">06:30 PM – Evening Fitting</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  Reason / Message to Customer
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Master cutter available at this slot..."
                  value={rescheduleData.adminNotes}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, adminNotes: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

