import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy, useEffect } from 'react';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import CartDrawer from './components/cart/CartDrawer';
import CookieBanner from './components/ui/CookieBanner';
import PWAInstallBanner from './components/PWAInstallBanner';

function HashScrollHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.hash || location.pathname !== '/') return;
    const id = location.hash.slice(1);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 68;
        try { window.scrollTo({ top, behavior: 'smooth' }); }
        catch { window.scrollTo(0, top); }
        // Clear hash from URL without re-triggering scroll
        navigate('/', { replace: true });
      } else if (++attempts < 20) {
        setTimeout(tryScroll, 100);
      }
    };
    setTimeout(tryScroll, 50);
  }, [location.hash, location.pathname]);

  return null;
}

const HomePage = lazy(() => import('./pages/HomePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminDishesPage = lazy(() => import('./pages/admin/AdminDishesPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminPromotionsPage = lazy(() => import('./pages/admin/AdminPromotionsPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const AlmhultskalasetPage = lazy(() => import('./pages/AlmhultskalasetPage'));

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
          success: { iconTheme: { primary: '#E8521A', secondary: '#fff' } },
        }}
      />
      <CartDrawer />
      <CookieBanner />
      <PWAInstallBanner />
      <HashScrollHandler />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
            <Route path="/almhultskalaset" element={<AlmhultskalasetPage />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="dishes" element={<AdminDishesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="promotions" element={<AdminPromotionsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
