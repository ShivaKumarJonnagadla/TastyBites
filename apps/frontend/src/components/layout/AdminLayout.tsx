import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  Settings, Megaphone, LogOut, Menu, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/dishes', label: 'Dishes', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/promotions', label: 'Promotions', icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({
  onClose,
  currentPath,
  admin,
  onLogout,
}: {
  onClose: () => void;
  currentPath: string;
  admin: { username: string; email: string } | null;
  onLogout: () => void;
}) {
  const isActive = (item: typeof navItems[0]) =>
    item.exact ? currentPath === item.to : currentPath.startsWith(item.to);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-spice-gradient flex items-center justify-center text-white font-bold shadow-warm">
            TB
          </div>
          <div>
            <p className="font-display font-bold text-gray-900">Tasty Bites</p>
            <p className="text-xs text-spice-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-spice-500 text-white shadow-warm'
                  : 'text-gray-600 hover:bg-spice-50 hover:text-spice-500'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-spice-100 flex items-center justify-center text-spice-600 font-bold text-sm">
            {admin?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{admin?.username}</p>
            <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const activeLabel = navItems.find((i) =>
    i.exact ? location.pathname === i.to : location.pathname.startsWith(i.to)
  )?.label || 'Admin';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 shadow-sm">
        <SidebarContent
          onClose={closeSidebar}
          currentPath={location.pathname}
          admin={admin}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={closeSidebar}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden"
            >
              <SidebarContent
                onClose={closeSidebar}
                currentPath={location.pathname}
                admin={admin}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <p className="text-sm text-gray-500">{activeLabel}</p>
          </div>
          <Link
            to="/"
            className="text-xs text-gray-500 hover:text-spice-500 transition-colors"
            target="_blank"
          >
            View Site →
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
