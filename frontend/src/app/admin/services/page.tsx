'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Check, Clock, AlertCircle } from 'lucide-react';
import API_URL from '@/lib/api';

interface ServiceItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  estimatedTurnaround: string;
  isActive: boolean;
}

export default function AdminServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    estimatedTurnaround: '24-48 Hours',
    isActive: true,
  });

  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/services`, {
        withCredentials: true,
      });
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching services', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      estimatedTurnaround: '24-48 Hours',
      isActive: true,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (svc: ServiceItem) => {
    setEditingService(svc);
    setFormData({
      name: svc.name,
      price: svc.price.toString(),
      description: svc.description || '',
      estimatedTurnaround: svc.estimatedTurnaround || '24-48 Hours',
      isActive: svc.isActive,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Service name is required');
      return;
    }

    const numericPrice = Number(formData.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setFormError('Price must be a valid non-negative number');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price: numericPrice,
        description: formData.description.trim(),
        estimatedTurnaround: formData.estimatedTurnaround.trim(),
        isActive: formData.isActive,
      };

      if (editingService) {
        await axios.put(`${API_URL}/services/${editingService._id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/services`, payload, {
          withCredentials: true,
        });
      }

      setModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (service: ServiceItem) => {
    try {
      await axios.put(
        `${API_URL}/services/${service._id}`,
        { isActive: !service.isActive },
        { withCredentials: true }
      );
      fetchServices();
    } catch (error) {
      console.error('Error updating service status', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the service "${name}"?`)) {
      try {
        await axios.delete(`${API_URL}/services/${id}`, {
          withCredentials: true,
        });
        fetchServices();
      } catch (error) {
        console.error('Error deleting service', error);
        alert('Failed to delete service');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
            Catalog Management
          </span>
          <h1 className="text-3xl font-bold font-serif text-foreground">Add-on Services</h1>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[650px]">
            <thead className="text-[10px] uppercase tracking-wider bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Service Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Turnaround</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{service.name}</td>
                  <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                    {service.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {service.estimatedTurnaround || '24-48 Hours'}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">
                    ₹{service.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        service.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {service.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 rounded-lg border border-border hover:bg-champagne/40 text-foreground transition-colors"
                        aria-label="Edit Service"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service._id, service.name)}
                        className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-destructive transition-colors"
                        aria-label="Delete Service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No services found. Click "Add New Service" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-serif font-bold text-lg text-foreground">
                {editingService ? 'Edit Tailoring Service' : 'Add New Tailoring Service'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saree Fall & Piko"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="uppercase tracking-wider font-semibold text-foreground">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 150"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="uppercase tracking-wider font-semibold text-foreground">
                    Estimated Turnaround
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24-48 Hours"
                    value={formData.estimatedTurnaround}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedTurnaround: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="uppercase tracking-wider font-semibold text-foreground">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of what is included in this tailoring service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-primary focus:ring-gold"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-foreground">
                  Active (Visible to customers on frontend)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
