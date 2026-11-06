'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Upload, Loader2, CheckCircle2, X, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import API_URL from '@/lib/api';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export default function CreateDesign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Staged file: selected-but-not-yet-uploaded
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Bridal Blouse',
    price: '',
    description: '',
    neckStyle: 'Round',
    sleeveType: 'Short',
    backDesign: 'Deep U',
    images: [] as { url: string; public_id?: string }[],
  });

  // ──────────────────────────────────────────────
  // Step 1: File selected → validate → stage + preview
  // ──────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadSuccess('');
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Invalid file type. Only JPG, JPEG and PNG are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File is too large. Maximum size is 5 MB.');
      e.target.value = '';
      return;
    }

    setStagedFile(file);
    setStagedPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  // ──────────────────────────────────────────────
  // Step 2: Click "Upload Image" → send to backend
  // ──────────────────────────────────────────────
  const handleUploadClick = async () => {
    if (!stagedFile) return;
    setUploadError('');
    setUploadSuccess('');

    try {
      setUploading(true);
      const data = new FormData();
      data.append('image', stagedFile);

      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const res = await axios.post(`${API_URL}/upload`, data, config);
      const { url, public_id } = res.data;

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { url, public_id }],
      }));

      // Clear staged file after successful upload
      setStagedFile(null);
      setStagedPreview(null);
      setUploadSuccess('Image uploaded successfully.');
    } catch (error: any) {
      console.error('Upload failed', error);
      setUploadError(error.response?.data?.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeUploaded = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  // ──────────────────────────────────────────────
  // Step 3: Submit full form
  // ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      alert('Please upload at least one image for this design.');
      return;
    }
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      await axios.post(`${API_URL}/designs`, {
        ...formData,
        price: Number(formData.price),
      }, config);

      router.push('/admin/designs');
    } catch (error) {
      console.error('Submission failed', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Designs
        </button>
        <h1 className="text-3xl font-bold font-serif text-foreground">Add New Design Collection</h1>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">

            {/* ── IMAGE UPLOADER ── */}
            <div>
              <label className="block text-sm font-semibold mb-3">Portfolio Images</label>

              {/* Already-uploaded images */}
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative w-32 h-40 rounded-xl overflow-hidden border shadow-sm group">
                      <Image src={img.url} alt="Design preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeUploaded(i)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Staged preview (selected but not yet uploaded) */}
              {stagedPreview && (
                <div className="mb-4 p-4 border-2 border-dashed border-primary/40 rounded-xl bg-primary/5 flex flex-col sm:flex-row items-start gap-4">
                  <div className="relative w-32 h-40 rounded-xl overflow-hidden border shadow-sm flex-shrink-0">
                    <Image src={stagedPreview} alt="Preview" fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">{stagedFile?.name}</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {stagedFile ? (stagedFile.size / 1024).toFixed(1) + ' KB' : ''}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="gap-2 h-9"
                      >
                        {uploading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Upload Image</>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setStagedFile(null); setStagedPreview(null); setUploadError(''); }}
                        className="h-9"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success / error messages */}
              {uploadSuccess && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm mb-4">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  {uploadSuccess}
                </div>
              )}
              {uploadError && (
                <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
                  {uploadError}
                </div>
              )}

              {/* Select-file button */}
              {!stagedPreview && (
                <label className="inline-flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-xl px-6 py-4 text-muted-foreground hover:bg-muted/50 transition text-sm font-medium">
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFileSelect} />
                  <ImageIcon className="h-5 w-5" />
                  Select Image (JPG / PNG, max 5 MB)
                </label>
              )}
            </div>

            {/* ── FORM FIELDS ── */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Design Name</label>
                <input required type="text" className="w-full h-10 px-3 rounded-md border focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Royal Bridal Blouse" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Base Price (₹)</label>
                <input required type="number" min="0" className="w-full h-10 px-3 rounded-md border focus:ring-1 focus:ring-primary outline-none" placeholder="1500" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
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
                <input required type="text" className="w-full h-10 px-3 rounded-md border focus:ring-1 focus:ring-primary outline-none" placeholder="Brief tagline or description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold font-serif mb-4">Default Structure Data</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Neck Style</label>
                  <input type="text" className="w-full h-10 px-3 rounded-md border text-sm" placeholder="e.g. Sweetheart" value={formData.neckStyle} onChange={e => setFormData({ ...formData, neckStyle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Sleeve Length</label>
                  <input type="text" className="w-full h-10 px-3 rounded-md border text-sm" placeholder="e.g. Short" value={formData.sleeveType} onChange={e => setFormData({ ...formData, sleeveType: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Back Pattern</label>
                  <input type="text" className="w-full h-10 px-3 rounded-md border text-sm" placeholder="e.g. Deep U" value={formData.backDesign} onChange={e => setFormData({ ...formData, backDesign: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 border-t flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="min-w-[150px]" disabled={loading || uploading || !!stagedFile}>
              {loading ? 'Saving Design...' : 'Publish to Gallery'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
