import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import RequireAdmin from './components/RequireAdmin'
import RequireAuth from './components/RequireAuth'
import AdminLoginPage from './pages/AdminLoginPage'
import AuthPage from './pages/AuthPage'
import CartPage from './pages/CartPage'
import CustomerCenterPage from './pages/CustomerCenterPage'
import HomePage from './pages/HomePage'
import MyPagePage from './pages/MyPagePage'
import NotFoundPage from './pages/NotFoundPage'
import NotificationsPage from './pages/NotificationsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import SellerDashboardPage from './pages/SellerDashboardPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="support" element={<CustomerCenterPage />} />

        <Route element={<RequireAuth allowedTypes={['user']} />}>
          <Route path="cart" element={<CartPage />} />
        </Route>

        <Route element={<RequireAuth allowedTypes={['user', 'seller']} />}>
          <Route path="mypage" element={<MyPagePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="admin/dashboard" element={<SellerDashboardPage />} />
          <Route path="seller/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}

export default App
