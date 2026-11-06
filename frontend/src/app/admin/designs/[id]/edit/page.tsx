'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import API_URL from '@/lib/api';


export default function EditDesign() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Bridal Blouse',
    price: '',
    description: '',
    neckStyle: '',
    sleeveType: '',
    backDesign: '',
  });

  // ── Load existing design ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/designs/${id}`);
        const d = data.design || data;
        setFormData({
          name: d.name || '',
          category: d.category || 'Bridal Blouse',
          price: String(d.price || ''),
          description: d.description || '',
          neckStyle: d.neckStyle || '',
          sleeveType: d.sleeveType || '',
          backDesign: d.backDesign || '',
        });
      } catch (err) {
        setError('Failed to load design. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDesign();
  }, [id]);

  // ── Submit update ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      await axios.put(`${API_URL}/designs/${id}`, {
        ...formData,
        price: Number(formData.price),
      }, config);

      router.push('/admin/designs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update design. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Designs
        </button>
        <h1 className="text-3xl font-bold font-serif text-foreground">Edit Design</h1>
        <p className="text-sm text-muted-foreground mt-1">Update the design details below. Images cannot be changed here; delete and re-create to change images.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Design Name</label>
                <input required type="text" className="w-full h-10 px-3 rounded-md border focus:ring-1 focus:ring-primary outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Base Price (₹)</label>
                <input required type="number" min="0" className="w-full h-10 px-3 rounded-md border focus:ring-1 focus:ring-primary outline-none" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Category Type</label>
                <select className="w-full h-10 px-3 rounded-md border bg-white focus:ring-1 outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="Bridal Blouse">Bridal Blouse</option>
                  <option value="Designer Blouse">Designer Blouse / Party Wear</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Casual">Casual</option>
                  <option value="Boat Neck Blouse">Boat Neck Blouse</option>
                  <option value="Back Design Blouse">Back Design Blouse</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Short Description</label>
                <input required type="text" className="w-full h-10 px-3 rounded-md border focus:ring-1 focus:ring-primary outline-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold font-serif mb-4">Structure Data</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Neck Style</label>
                  <input type="text" className="w-full h-10 px-3 rounded-md border text-sm" value={formData.neckStyle} onChange={e => setFormData({ ...formData, neckStyle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Sleeve Length</label>
                  <input type="text" className="w-full h-10 px-3 rounded-md border text-sm" value={formData.sleeveType} onChange={e => setFormData({ ...formData, sleeveType: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Back Pattern</label>
                  <input type="text" className="w-full h-10 px-3 rounded-md border text-sm" value={formData.backDesign} onChange={e => setFormData({ ...formData, backDesign: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 border-t flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="min-w-[150px]" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
