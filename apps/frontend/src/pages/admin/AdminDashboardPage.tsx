import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Clock, CheckCircle, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { orderApi, dishApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  weekRevenue: number;
}

interface Order {
  id: string;
  customerName: string;
  mobileNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  orderDate: string;
  orderItems: { dish: { name: string }; quantity: number }[];
}

const statCards = (stats: Stats) => [
  { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50', change: '' },
  { label: "Today's Revenue", value: `SEK ${stats.todayRevenue.toFixed(0)}`, icon: TrendingUp, color: 'text-green-600 bg-green-50', change: '' },
  { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-orange-600 bg-orange-50', change: '' },
  { label: 'This Week', value: `SEK ${stats.weekRevenue.toFixed(0)}`, icon: CheckCircle, color: 'text-spice-600 bg-spice-50', change: '' },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function AdminDashboardPage() {
  const { admin } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [dishCount, setDishCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes, dishesRes] = await Promise.all([
          orderApi.getStats(),
          orderApi.getAll({ limit: 5 }),
          dishApi.getAll({ limit: 1 }),
        ]);
        setStats(statsRes.data.data);
        setRecentOrders(ordersRes.data.data || []);
        setDishCount(dishesRes.data.total || 0);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Welcome back, {admin?.username}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with Tasty Bites today.</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 skeleton h-28" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards(stats).map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/dishes', label: 'Add Dish', emoji: '➕', color: 'bg-spice-50 text-spice-700 border-spice-100' },
          { to: '/admin/orders', label: 'View Orders', emoji: '📋', color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { to: '/admin/promotions', label: 'WhatsApp Promo', emoji: '📱', color: 'bg-green-50 text-green-700 border-green-100' },
          { to: '/admin/settings', label: 'Settings', emoji: '⚙️', color: 'bg-gray-50 text-gray-700 border-gray-200' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`card border p-4 flex items-center gap-3 hover:shadow-md transition-all ${action.color}`}
          >
            <span className="text-2xl">{action.emoji}</span>
            <span className="text-sm font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-lg">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-spice-500 hover:text-spice-600 flex items-center gap-1 font-medium"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <UtensilsCrossed size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No orders yet. Share your menu!</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.orderItems?.map((i) => `${i.dish?.name} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">SEK {Number(order.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
