import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Filter, ChevronDown, Plus, MessageCircle, Archive, X, Trash2 } from 'lucide-react';
import { orderApi, dishApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface Dish {
  id: string;
  name: string;
  price: number;
  menuType: string;
  isAvailable: boolean;
}

interface Order {
  id: string;
  customerName: string;
  mobileNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  source: 'WEBSITE' | 'WHATSAPP';
  orderDate: string;
  archivedAt: string | null;
  deliveryNote: string | null;
  notes: string | null;
  orderItems: { dish: { name: string; price: number; menuType: string }; quantity: number; price: number }[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PREPARING: 'bg-blue-100 text-blue-700 border-blue-200',
  READY: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
};

const STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

interface ManualOrderItem { dishId: string; quantity: number }

const emptyForm = () => ({
  customerName: '',
  mobileNumber: '+46',
  paymentMethod: 'SWISH' as 'SWISH' | 'CASH',
  deliveryNote: '',
  notes: '',
  items: [] as ManualOrderItem[],
});

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  // Manual order form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [fridayDishes, setFridayDishes] = useState<Dish[]>([]);

  const fridayOrderCount = orders.filter(
    (o) => o.orderItems?.some((i) => i.dish?.menuType === 'FRIDAY' || i.dish?.menuType === 'BOTH')
  ).length;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean | number> = { limit: 200 };
      if (tab === 'archived') params.archived = true;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;

      const res = await orderApi.getAll(params);
      setOrders(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: unknown) {
      console.error('Failed to load orders:', err);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchFridayDishes = async () => {
    try {
      const res = await dishApi.getAll({ limit: 200 });
      const all: Dish[] = res.data.data || res.data || [];
      setFridayDishes(all.filter((d) => d.menuType === 'FRIDAY' || d.menuType === 'BOTH'));
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchOrders(); }, [tab, startDate, endDate, statusFilter]);
  useEffect(() => { if (showForm) fetchFridayDishes(); }, [showForm]);

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

  const handleArchive = async () => {
    if (!window.confirm(`Archive all ${fridayOrderCount} active Friday orders? This marks them as last week's orders so you can track next week fresh.`)) return;
    setArchiving(true);
    try {
      const res = await orderApi.archiveFriday();
      toast.success(res.data.message || 'Friday orders archived');
      fetchOrders();
    } catch {
      toast.error('Archive failed');
    } finally {
      setArchiving(false);
    }
  };

  // --- Manual order form handlers ---
  const setItemQty = (dishId: string, qty: number) => {
    setForm((f) => {
      const existing = f.items.find((i) => i.dishId === dishId);
      if (qty <= 0) return { ...f, items: f.items.filter((i) => i.dishId !== dishId) };
      if (existing) return { ...f, items: f.items.map((i) => i.dishId === dishId ? { ...i, quantity: qty } : i) };
      return { ...f, items: [...f.items, { dishId, quantity: qty }] };
    });
  };

  const getItemQty = (dishId: string) => form.items.find((i) => i.dishId === dishId)?.quantity ?? 0;

  const manualTotal = form.items.reduce((sum, item) => {
    const dish = fridayDishes.find((d) => d.id === item.dishId);
    return sum + (dish ? dish.price * item.quantity : 0);
  }, 0);

  const handleSubmitManual = async () => {
    if (!form.customerName.trim()) { toast.error('Customer name required'); return; }
    if (!form.mobileNumber.trim()) { toast.error('Phone number required'); return; }
    if (form.items.length === 0) { toast.error('Add at least one dish'); return; }
    setSubmitting(true);
    try {
      await orderApi.createManual({
        customerName: form.customerName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        paymentMethod: form.paymentMethod,
        items: form.items,
        deliveryNote: form.deliveryNote.trim(),
        notes: form.notes.trim(),
      });
      toast.success('WhatsApp order added!');
      setShowForm(false);
      setForm(emptyForm());
      fetchOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save order');
      console.error('WhatsApp order error:', err);
    } finally {
      setSubmitting(false);
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
        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchOrders} disabled={loading} className="btn-ghost border border-gray-200">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <MessageCircle size={15} /> Add WhatsApp Order
          </button>
          {tab === 'active' && fridayOrderCount > 0 && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Archive size={15} />
              {archiving ? 'Archiving…' : `Archive Friday Orders (${fridayOrderCount})`}
            </button>
          )}
          <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm">
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['active', 'archived'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setExpandedId(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'active' ? 'Active Orders' : 'Archived Friday Orders'}
          </button>
        ))}
      </div>

      {/* Archive info banner for archived tab */}
      {tab === 'archived' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <Archive size={16} className="flex-shrink-0" />
          <span>These are past Friday orders archived by week. Press <strong>Archive Friday Orders</strong> every Sunday to move current week's orders here.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter size={14} /> Filters:
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field py-2 text-sm w-auto" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field py-2 text-sm w-auto" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field py-2 text-sm w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(startDate || endDate || statusFilter) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter(''); }} className="text-sm text-spice-500 hover:text-spice-600">
            Clear filters
          </button>
        )}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center">
            <motion.div className="w-8 h-8 border-2 border-spice-200 border-t-spice-500 rounded-full mx-auto"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p>{tab === 'archived' ? 'No archived Friday orders yet.' : 'No orders found for the selected filters.'}</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div key={order.id} layout className="card overflow-hidden">
              <div
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                    <span className="text-xs text-gray-400">{order.mobileNumber}</span>
                    {order.source === 'WHATSAPP' && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full font-medium">
                        <MessageCircle size={10} /> WhatsApp
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {order.orderItems?.map((i) => `${i.dish?.name} ×${i.quantity}`).join(', ')}
                  </p>
                  {order.deliveryNote && (
                    <p className="text-xs text-amber-600 mt-0.5">📍 {order.deliveryNote}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <p className="font-bold text-gray-900">SEK {Number(order.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">{new Date(order.orderDate).toLocaleDateString('sv-SE')}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
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
                          <span className="text-gray-500">Source</span>
                          <span className={`font-medium ${order.source === 'WHATSAPP' ? 'text-green-600' : 'text-blue-600'}`}>{order.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Time</span>
                          <span className="font-medium">{new Date(order.orderDate).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {order.deliveryNote && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Delivery</span>
                            <span className="font-medium text-amber-700">{order.deliveryNote}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div>
                            <span className="text-gray-500">Notes: </span>
                            <span className="italic">{order.notes}</span>
                          </div>
                        )}
                        {tab === 'archived' && order.archivedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Archived</span>
                            <span className="text-amber-600">{new Date(order.archivedAt).toLocaleDateString('sv-SE')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {tab === 'active' && (
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
                  )}
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Add WhatsApp Order Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <MessageCircle size={16} className="text-green-600" />
                    </div>
                    <h2 className="font-display font-bold text-gray-900">Add WhatsApp Order</h2>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                {/* Modal body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {/* Customer info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name *</label>
                      <input
                        type="text"
                        value={form.customerName}
                        onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                        placeholder="e.g. Ahmed Ali"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                      <input
                        type="text"
                        value={form.mobileNumber}
                        onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
                        placeholder="+46 7XX XXX XXX"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment</label>
                      <select
                        value={form.paymentMethod}
                        onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as 'SWISH' | 'CASH' }))}
                        className="input-field"
                      >
                        <option value="SWISH">Swish</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Location</label>
                      <input
                        type="text"
                        value={form.deliveryNote}
                        onChange={(e) => setForm((f) => ({ ...f, deliveryNote: e.target.value }))}
                        placeholder="e.g. Kry Parkering — Fri 12:00"
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Dish picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Friday Menu Items *</label>
                    {fridayDishes.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Loading dishes…</p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {fridayDishes.map((dish) => {
                          const qty = getItemQty(dish.id);
                          return (
                            <div key={dish.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${qty > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{dish.name}</p>
                                <p className="text-xs text-gray-500">SEK {dish.price}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                <button
                                  onClick={() => setItemQty(dish.id, qty - 1)}
                                  disabled={qty === 0}
                                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold disabled:opacity-30 hover:bg-gray-50 flex items-center justify-center"
                                >−</button>
                                <span className="text-sm font-semibold w-5 text-center">{qty}</span>
                                <button
                                  onClick={() => setItemQty(dish.id, qty + 1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center"
                                >+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {form.items.length > 0 && (
                      <p className="text-sm font-semibold text-gray-700 mt-2">
                        Total: <span className="text-spice-600">SEK {manualTotal}</span>
                        <span className="text-gray-400 font-normal ml-2">({form.items.reduce((s, i) => s + i.quantity, 0)} portions)</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Any special instructions…"
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <button
                    onClick={() => { setShowForm(false); setForm(emptyForm()); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitManual}
                    disabled={submitting || form.items.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus size={15} />
                    {submitting ? 'Saving…' : 'Add Order'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
