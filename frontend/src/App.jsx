import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const Profile = lazy(() => import('./pages/Profile'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Weather = lazy(() => import('./pages/Weather'))

// Farmer pages
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'))
const Farms = lazy(() => import('./pages/farmer/Farms'))
const Fields = lazy(() => import('./pages/farmer/Fields'))
const Crops = lazy(() => import('./pages/farmer/Crops'))
const Sensors = lazy(() => import('./pages/farmer/Sensors'))
const SensorDetail = lazy(() => import('./pages/farmer/SensorDetail'))
const AIAssistant = lazy(() => import('./pages/farmer/AIAssistant'))
const CropRecommendation = lazy(() => import('./pages/farmer/CropRecommendation'))
const Irrigation = lazy(() => import('./pages/farmer/Irrigation'))
const Tasks = lazy(() => import('./pages/farmer/Tasks'))
const Resources = lazy(() => import('./pages/farmer/Resources'))
const FarmerProducts = lazy(() => import('./pages/farmer/FarmerProducts'))
const FarmerOrders = lazy(() => import('./pages/farmer/FarmerOrders'))
const FarmerReports = lazy(() => import('./pages/farmer/FarmerReports'))

// Buyer pages
const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'))
const Marketplace = lazy(() => import('./pages/buyer/Marketplace'))
const ProductDetail = lazy(() => import('./pages/buyer/ProductDetail'))
const Cart = lazy(() => import('./pages/buyer/Cart'))
const Checkout = lazy(() => import('./pages/buyer/Checkout'))
const BuyerOrders = lazy(() => import('./pages/buyer/BuyerOrders'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const BuyerComplaints = lazy(() => import('./pages/buyer/BuyerComplaints'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'))
const AdminSensors = lazy(() => import('./pages/admin/AdminSensors'))
const AdminSystemConfig = lazy(() => import('./pages/admin/AdminSystemConfig'))

function withSuspense(node) {
  return <Suspense fallback={<LoadingSpinner full />}>{node}</Suspense>
}

function HomeRedirect() {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  if (role === 'ADMIN') return <Navigate to="/admin" replace />
  if (role === 'FARMER') return <Navigate to="/farmer" replace />
  return <Navigate to="/buyer" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={withSuspense(<Login />)} />
      <Route path="/register" element={withSuspense(<Register />)} />
      <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
      <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />

      <Route path="/profile" element={<ProtectedRoute><Layout>{withSuspense(<Profile />)}</Layout></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><Layout>{withSuspense(<ChangePassword />)}</Layout></ProtectedRoute>} />
      <Route path="/weather" element={<ProtectedRoute><Layout>{withSuspense(<Weather />)}</Layout></ProtectedRoute>} />

      {/* Farmer */}
      <Route path="/farmer" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<FarmerDashboard />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/farms" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<Farms />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/fields" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<Fields />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/crops" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<Crops />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/sensors" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<Sensors />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/sensors/:id" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<SensorDetail />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/ai-assistant" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<AIAssistant />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/crop-recommendation" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<CropRecommendation />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/irrigation" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<Irrigation />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/tasks" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<Tasks />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/resources" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<Resources />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/products" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<FarmerProducts />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/orders" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<FarmerOrders />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/reports" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<FarmerReports />)}</Layout></ProtectedRoute>} />
      <Route path="/farmer/orders/:id" element={<ProtectedRoute roles={['FARMER']}><Layout>{withSuspense(<OrderDetail />)}</Layout></ProtectedRoute>} />

      {/* Buyer */}
      <Route path="/buyer" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<BuyerDashboard />)}</Layout></ProtectedRoute>} />
      <Route path="/buyer/marketplace" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<Marketplace />)}</Layout></ProtectedRoute>} />
      <Route path="/buyer/marketplace/:id" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<ProductDetail />)}</Layout></ProtectedRoute>} />
      <Route path="/buyer/cart" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<Cart />)}</Layout></ProtectedRoute>} />
      <Route path="/buyer/checkout" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<Checkout />)}</Layout></ProtectedRoute>} />
      <Route path="/buyer/orders" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<BuyerOrders />)}</Layout></ProtectedRoute>} />
      <Route path="/buyer/orders/:id" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<OrderDetail />)}</Layout></ProtectedRoute>} />
      <Route path="/buyer/complaints" element={<ProtectedRoute roles={['BUYER']}><Layout>{withSuspense(<BuyerComplaints />)}</Layout></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminDashboard />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminUsers />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminProducts />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminCategories />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminOrders />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/orders/:id" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<OrderDetail />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminComplaints />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/sensors" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminSensors />)}</Layout></ProtectedRoute>} />
      <Route path="/admin/system-config" element={<ProtectedRoute roles={['ADMIN']}><Layout>{withSuspense(<AdminSystemConfig />)}</Layout></ProtectedRoute>} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}