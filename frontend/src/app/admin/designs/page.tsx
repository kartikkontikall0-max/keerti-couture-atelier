'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import API_URL from '@/lib/api';


export default function AdminDesigns() {
  const router = useRouter();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/designs`);
      setDesigns(data);
    } catch (error) {
      console.error('Error fetching designs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this design?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`${API_URL}/designs/${id}`, config);
        fetchDesigns();
      } catch (error) {
        console.error('Error deleting design', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-serif text-foreground">Manage Designs</h1>
        <Link href="/admin/designs/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add New Design
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design: any) => (
                <tr key={design._id} className="border-b last:border-0 hover:bg-muted/50 transition">
                  <td className="px-6 py-4">
                    <div className="h-12 w-12 rounded-md overflow-hidden relative bg-muted flex items-center justify-center">
                      {design.images && design.images[0] ? (
                        <Image src={design.images[0].url} alt={design.name} fill className="object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{design.name}</td>
                  <td className="px-6 py-4">{design.category}</td>
                  <td className="px-6 py-4 font-medium">₹{design.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push(`/admin/designs/${design._id}/edit`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(design._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {designs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No designs found. Add your first design!</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
