import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import { orderApi } from '../../lib/api';

type Period = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'allTime';

interface Order {
  id: string;
  customerName: string;
  mobileNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  orderDate: string;
  orderItems: { quantity: number; dish: { name: string } }[];
}

const PERIOD_LABELS: Record<Period, string> = {
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  allTime: 'All Time',
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateRange(period: Period): { startDate?: string; endDate?: string } {
  const now = new Date();
  if (period === 'allTime') return {};

  if (period === 'thisWeek') {
    return { startDate: getMonday(now).toISOString() };
  }

  if (period === 'lastWeek') {
    const thisMonday = getMonday(now);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday);
    lastSunday.setDate(thisMonday.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);
    return { startDate: lastMonday.toISOString(), endDate: lastSunday.toISOString() };
  }

  if (period === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: start.toISOString() };
  }

  if (period === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  return {};
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>('thisWeek');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRange(period);
        const params: Record<string, string | number> = { limit: 500, archived: 'all' };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const res = await orderApi.getAll(params);
        setOrders(res.data.data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [period]);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const statCards = [
    { label: 'Total Orders', value: String(orders.length), icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Revenue', value: `SEK ${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Avg. Order', value: `SEK ${avgOrderValue.toFixed(0)}`, icon: TrendingUp, color: 'text-spice-600 bg-spice-50' },
    { label: 'Completed', value: String(completedOrders), icon: CheckCircle, color: 'text-gray-600 bg-gray-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">Sales and order statistics by period</p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="input-field pr-10 appearance-none cursor-pointer font-medium min-w-[160px]"
          >
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card p-5"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon size={18} />
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            )}
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending badge */}
      {!loading && pendingOrders > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <Clock size={15} className="text-yellow-600 shrink-0" />
          <span><strong>{pendingOrders}</strong> pending order{pendingOrders !== 1 ? 's' : ''} in this period still awaiting action.</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Orders — <span className="text-spice-600">{PERIOD_LABELS[period]}</span>
          </h2>
          {!loading && (
            <span className="text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <motion.div
              className="w-8 h-8 border-2 border-spice-200 border-t-spice-500 rounded-full mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <ShoppingBag size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No orders for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Date', 'Customer', 'Items', 'Amount', 'Payment', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(order.orderDate).toLocaleDateString('en-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.mobileNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[220px]">
                      <span className="line-clamp-2">
                        {order.orderItems?.map((i) => `${i.dish?.name} ×${i.quantity}`).join(', ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">SEK {Number(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            <span className="font-bold text-gray-900">Total: SEK {totalRevenue.toFixed(0)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
