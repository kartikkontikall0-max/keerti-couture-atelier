'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import API_URL from '@/lib/api';

import { Button } from '@/components/ui/Button';
import { ArrowLeft, User, Phone, Ruler, Scissors, Box, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function AdminOrderDetails() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get(`${API_URL}/orders/${params.id}`, config);
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order details', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOrder();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`${API_URL}/orders/${order._id}/status`, { status: newStatus }, config);
      setOrder({ ...order, status: newStatus });
      alert('Order status updated!');
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    }
  };

  const handlePaymentStatusChange = async (newPaymentStatus: string) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`${API_URL}/orders/${order._id}/status`, { paymentStatus: newPaymentStatus }, config);
      
      let newRemaining = order.remainingAmount;
      if (newPaymentStatus === 'Paid') {
        newRemaining = 0;
      } else if (newPaymentStatus === 'Partially Paid') {
        newRemaining = order.totalPrice - (order.advanceAmount || 300);
      } else if (newPaymentStatus === 'Pending') {
        newRemaining = order.totalPrice;
      }

      setOrder({ 
        ...order, 
        paymentStatus: newPaymentStatus,
        remainingAmount: newRemaining
      });
      alert('Payment status updated successfully!');
    } catch (error) {
      console.error('Failed to update payment status', error);
      alert('Failed to update payment status');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!order) return <div className="p-20 text-center">Order not found</div>;

  const statuses = ['Order received', 'Stitching started', 'Stitching completed', 'Ready for pickup', 'Delivered'];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </button>
          <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
            Order <span className="text-lg font-mono bg-gray-100 px-3 py-1 rounded-md">#{order._id.slice(-8)}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
          <span className="text-sm font-bold text-gray-500 px-2 uppercase tracking-wide">Status:</span>
          <select
            className="h-10 rounded-md border-0 bg-gray-50 px-3 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom Reference Image Uploaded by User */}
          {order.customReferenceImage?.url && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-primary/10 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 text-primary"><ImageIcon className="h-5 w-5" /> Customer Inspiration Image</h3>
                <span className="text-xs font-bold uppercase tracking-widest bg-primary/20 text-primary px-2 py-1 rounded-md">Custom Upload</span>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-6">
                <a href={order.customReferenceImage.url} target="_blank" rel="noopener noreferrer" className="relative aspect-[4/5] h-48 rounded-xl overflow-hidden border shadow-sm block flex-shrink-0 hover:opacity-90 transition group cursor-zoom-in">
                   <Image src={order.customReferenceImage.url} alt="Customer Reference" fill className="object-cover" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">View Full Size</div>
                </a>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-2">Customer Notes:</h4>
                  <div className="bg-white/60 rounded-xl p-4 text-sm leading-relaxed border border-primary/10 min-h-[100px] italic text-gray-800">
                    "{order.customReferenceImage.notes || 'No additional notes provided by the customer.'}"
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold flex items-center gap-2"><Box className="h-5 w-5 text-gray-500" /> Reference Design</h3>
            </div>
            <div className="p-6 flex flex-col sm:flex-row gap-6">
              <div className="relative h-32 w-24 rounded-lg overflow-hidden border">
                <Image src={order.design?.images[0]?.url || 'https://images.unsplash.com/photo-1610996885374-1234c9884e60?auto=format&fit=crop&q=80'} alt="Designer blouse image" fill className="object-cover" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xl">{order.design?.name}</h4>
                <p className="text-sm font-bold text-primary mt-1">₹{order.design?.price}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold flex items-center gap-2"><Scissors className="h-5 w-5 text-gray-500" /> Customization Preferences</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Neck Style</span><p className="font-medium">{order.customizationOptions?.neckStyle || 'Standard'}</p></div>
                <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Sleeves</span><p className="font-medium">{order.customizationOptions?.sleeveType || 'Standard'}</p></div>
                <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Back Design</span><p className="font-medium">{order.customizationOptions?.backDesign || 'Standard'}</p></div>
                <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Fabric Color</span><p className="font-medium">{order.customizationOptions?.fabricColor || 'Standard'}</p></div>
                <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Embroidery</span><p className="font-medium">{order.customizationOptions?.embroideryOption || 'None'}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold flex items-center gap-2"><Ruler className="h-5 w-5 text-gray-500" /> Exact Measurements (Inches)</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {Object.entries(order.measurements || {}).map(([key, value]) => {
                  if (key === '_id' || key === 'guideImageNotes') return null;
                  return (
                    <div key={key} className="bg-gray-50 border rounded-lg p-3 text-center min-w-[100px]">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <p className="font-bold text-lg">{String(value)}"</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Customer & Services */}
        <div className="space-y-8">
          
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold flex items-center gap-2"><User className="h-5 w-5 text-gray-500" /> Customer Info</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Name</span>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Account Email</span>
                <p className="font-medium">{order.user?.email || 'Guest'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold block mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</span>
                <p className="font-medium">{order.phone}</p>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">💳 Payment Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Payment Method</span>
                <p className="font-medium">
                  {order.paymentMethod === 'PayOnline' && 'Full Online Payment (Razorpay)'}
                  {order.paymentMethod === 'PayAdvance' && 'Advance Deposit (Razorpay)'}
                  {order.paymentMethod === 'PayAtPickup' && 'Pay at Pickup'}
                  {!order.paymentMethod && 'Pay at Pickup (Default)'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Payment Status</span>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none"
                  value={order.paymentStatus || 'Pending'}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              {order.paymentMethod === 'PayAdvance' && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Advance Amount Paid</span>
                  <p className="font-semibold text-green-700">₹{(order.advanceAmount || 0).toLocaleString()}</p>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs text-gray-500 uppercase font-bold">
                  <span>Total Price</span>
                  <span>Remaining Balance</span>
                </div>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-medium">₹{order.totalPrice?.toLocaleString()}</span>
                  <span className="text-lg font-bold text-amber-700">₹{(order.remainingAmount !== undefined ? order.remainingAmount : order.totalPrice).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-bold">Billing Summary</h3>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Base Design</span>
                <span className="font-medium">₹{order.design?.price}</span>
              </div>
              
              {order.extraServices && order.extraServices.length > 0 && (
                <div className="pt-3 mt-3 border-t">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Extra Services</span>
                  {order.extraServices.map((svc: any) => (
                    <div key={svc._id} className="flex justify-between items-center text-gray-600 mb-1">
                      <span>{svc.name}</span>
                      <span className="font-medium">+₹{svc.price}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 mt-4 border-t">
                <span className="font-bold text-base">Total Charged</span>
                <span className="font-bold text-xl text-primary">₹{order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
