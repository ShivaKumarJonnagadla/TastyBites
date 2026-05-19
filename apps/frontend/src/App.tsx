import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import CartDrawer from './components/cart/CartDrawer';
import CookieBanner from './components/ui/CookieBanner';

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
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
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
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
