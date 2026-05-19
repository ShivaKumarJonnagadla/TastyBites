import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { orderApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  customerName: string;
  mobileNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  orderDate: string;
  notes: string | null;
  orderItems: { dish: { name: string; price: number }; quantity: number; price: number }[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PREPARING: 'bg-blue-100 text-blue-700 border-blue-200',
  READY: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
};

const STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;

      const res = await orderApi.getAll({ ...params, limit: 100 });
      setOrders(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [startDate, endDate, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await orderApi.updateStatus(id, status);
      toast.success('Status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await orderApi.export(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tastybites-orders-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{total} orders — SEK {totalRevenue.toFixed(0)} revenue</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} disabled={loading} className="btn-ghost border border-gray-200">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm">
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter size={14} /> Filters:
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input-field py-2 text-sm w-auto"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input-field py-2 text-sm w-auto"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field py-2 text-sm w-auto"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(startDate || endDate || statusFilter) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter(''); }}
            className="text-sm text-spice-500 hover:text-spice-600"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center">
            <motion.div className="w-8 h-8 border-2 border-spice-200 border-t-spice-500 rounded-full mx-auto"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p>No orders found for the selected filters.</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              className="card overflow-hidden"
            >
              <div
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                    <span className="text-xs text-gray-400">{order.mobileNumber}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {order.orderItems?.map((i) => `${i.dish?.name} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <p className="font-bold text-gray-900">SEK {Number(order.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">{new Date(order.orderDate).toLocaleDateString('sv-SE')}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {expandedId === order.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-gray-100 px-5 py-4 bg-gray-50/30"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Order Items</p>
                      <div className="space-y-1">
                        {order.orderItems?.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.dish?.name} × {item.quantity}</span>
                            <span className="font-medium">SEK {Number(item.price) * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Details</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment</span>
                          <span className="font-medium">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Time</span>
                          <span className="font-medium">{new Date(order.orderDate).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {order.notes && (
                          <div>
                            <span className="text-gray-500">Notes: </span>
                            <span className="italic">{order.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order.id, status)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            order.status === status
                              ? statusColors[status]
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
