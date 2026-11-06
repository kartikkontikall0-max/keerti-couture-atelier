'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import API_URL from '@/lib/api';
import { Package, Search, Filter, CheckCircle2, Clock } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/orders`, {
        withCredentials: true,
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.put(
        `${API_URL}/orders/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status', error);
      alert('Failed to update order status');
    }
  };

  const statuses = [
    'Order received',
    'Stitching started',
    'Stitching completed',
    'Ready for pickup',
    'Delivered',
  ];

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'All') return true;
    return (o.status || '').toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
            Fulfillment Studio
          </span>
          <h1 className="text-3xl font-bold font-serif text-foreground">Manage Orders</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground outline-none"
          >
            <option value="All">All Statuses ({orders.length})</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button onClick={fetchOrders} variant="outline" className="text-xs h-10 rounded-xl">
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border p-8">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-foreground">No Orders Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {filterStatus !== 'All' ? 'Try switching the status filter.' : 'New customer orders will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Silhouette</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Tailoring Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-foreground">
                      KC-{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground">{order.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{order.phone || order.user?.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-foreground">{order.design?.name || 'Custom Blouse'}</p>
                      <p className="text-[11px] text-muted-foreground">{order.customizationOptions?.fabricColor}</p>
                    </td>
                    <td className="py-4 px-4 font-bold text-foreground">
                      ₹{order.totalPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-semibold text-foreground outline-none cursor-pointer focus:border-gold"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <a
                        href={`/admin/orders/${order._id}`}
                        className="text-primary hover:underline font-semibold text-[11px]"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
