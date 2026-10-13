import client from './client'

export const api = {
  // Auth
  register: (data) => client.post('/auth/register/', data),
  login: (data) => client.post('/auth/login/', data),
  logout: (refresh) => client.post('/auth/logout/', { refresh }),
  profile: () => client.get('/auth/profile/'),
  updateProfile: (data) => client.patch('/auth/profile/', data),
  changePassword: (data) => client.post('/auth/change-password/', data),
  forgotPassword: (email) => client.post('/auth/forgot-password/', { email }),
  resetPassword: (data) => client.post('/auth/reset-password/', data),

  // Farms / Fields / Crops
  getFarms: (params) => client.get('/farms/', { params }),
  createFarm: (data) => client.post('/farms/', data),
  updateFarm: (id, data) => client.patch(`/farms/${id}/`, data),
  deleteFarm: (id) => client.delete(`/farms/${id}/`),

  getFields: (params) => client.get('/fields/', { params }),
  createField: (data) => client.post('/fields/', data),
  updateField: (id, data) => client.patch(`/fields/${id}/`, data),
  deleteField: (id) => client.delete(`/fields/${id}/`),

  getCrops: (params) => client.get('/crops/', { params }),
  createCrop: (data) => client.post('/crops/', data),
  updateCrop: (id, data) => client.patch(`/crops/${id}/`, data),
  deleteCrop: (id) => client.delete(`/crops/${id}/`),

  // Sensors
  getSensors: (params) => client.get('/sensors/', { params }),
  getSensor: (id) => client.get(`/sensors/${id}/`),
  createSensor: (data) => client.post('/sensors/', data),
  deleteSensor: (id) => client.delete(`/sensors/${id}/`),
  getSensorReadings: (id, params) => client.get(`/sensors/${id}/readings/`, { params }),
  getSensorHistory: (id, params) => client.get(`/sensors/${id}/history/`, { params }),
  getSensorHistoryAll: (params) => client.get('/sensor-readings/history/', { params }),
  getSensorAggregate: (params) => client.get('/sensor-readings/aggregate/', { params }),
  postIoTReading: (data) => client.post('/sensors/iot/reading/', data,
    { headers: { 'X-Device-Token': data.device_token || 'dhartix-iot-device-token' } }),
  markSensorOffline: (id) => client.post(`/sensors/${id}/mark_offline/`),

  // Tasks
  getTasks: (params) => client.get('/tasks/', { params }),
  createTask: (data) => client.post('/tasks/', data),
  updateTask: (id, data) => client.patch(`/tasks/${id}/`, data),
  deleteTask: (id) => client.delete(`/tasks/${id}/`),

  // Resources
  getResources: (params) => client.get('/resources/', { params }),
  createResource: (data) => client.post('/resources/', data),
  updateResource: (id, data) => client.patch(`/resources/${id}/`, data),
  deleteResource: (id) => client.delete(`/resources/${id}/`),

  // AI
  aiChat: (data) => client.post('/ai/chat/', data),
  aiConversations: () => client.get('/ai/conversations/'),
  aiConversationMessages: (id) => client.get(`/ai/conversations/${id}/messages/`),
  cropRecommendation: (data) => client.post('/ai/crop-recommendation/', data),
  fertilizerRecommendation: (data) => client.post('/ai/fertilizer-recommendation/', data),
  irrigationRecommendation: (data) => client.post('/ai/irrigation-recommendation/', data),

  // Marketplace
  getProducts: (params) => client.get('/products/', { params }),
  getProduct: (id) => client.get(`/products/${id}/`),
  createProduct: (data) => client.post('/products/', data),
  updateProduct: (id, data) => client.patch(`/products/${id}/`, data),
  deleteProduct: (id) => client.delete(`/products/${id}/`),
  getCategories: () => client.get('/categories/'),
  createCategory: (data) => client.post('/categories/', data),
  updateCategory: (id, data) => client.patch(`/categories/${id}/`, data),
  deleteCategory: (id) => client.delete(`/categories/${id}/`),

  // Cart / Orders
  getCart: () => client.get('/cart/'),
  addToCart: (data) => client.post('/cart/', data),
  updateCartItem: (id, data) => client.patch(`/cart/items/${id}/`, data),
  removeCartItem: (id) => client.delete(`/cart/items/${id}/`),
  clearCart: () => client.delete('/cart/clear/'),
  checkout: (data) => client.post('/checkout/', data),
  getOrders: (params) => client.get('/orders/', { params }),
  getOrder: (id) => client.get(`/orders/${id}/`),
  myOrders: (params) => client.get('/my-orders/', { params }),
  farmerOrders: (params) => client.get('/farmer-orders/', { params }),
  farmerOrderItems: (params) => client.get('/farmer-order-items/', { params }),
  updateOrderItemStatus: (orderId, data) => client.post(`/orders/${orderId}/update_item_status/`, data),

  // Notifications
  getNotifications: (params) => client.get('/notifications/', { params }),
  unreadCount: () => client.get('/notifications/unread-count/'),
  markAllRead: () => client.post('/notifications/mark-all-read/'),
  markRead: (id) => client.post('/notifications/mark-read/', { notification_id: id }),

  // Weather
  currentWeather: (params) => client.get('/weather/current/', { params }),
  weatherForecast: (params) => client.get('/weather/forecast/', { params }),

  // Reports
  farmReport: (params) => client.get('/reports/farm/', { params }),
  cropReport: (params) => client.get('/reports/crop/', { params }),
  sensorReport: (params) => client.get('/reports/sensor/', { params }),
  salesReport: (params) => client.get('/reports/sales/', { params }),
  resourceReport: (params) => client.get('/reports/resource/', { params }),

  // Dashboard
  farmerDashboard: () => client.get('/dashboard/farmer/'),
  buyerDashboard: () => client.get('/dashboard/buyer/'),
  adminDashboard: () => client.get('/dashboard/admin/'),
  systemConfig: () => client.get('/auth/admin/system-config/'),

  // Admin
  adminUsers: (params) => client.get('/auth/admin/users/', { params }),
  adminUpdateUser: (id, data) => client.patch(`/auth/admin/users/${id}/`, data),
  adminDeleteUser: (id) => client.delete(`/auth/admin/users/${id}/`),

  // Complaints
  getComplaints: (params) => client.get('/complaints/', { params }),
  createComplaint: (data) => client.post('/complaints/', data),
  updateComplaint: (id, data) => client.patch(`/complaints/${id}/`, data),
}

export const reportExportUrl = (kind, params, format) => {
  const query = new URLSearchParams({ ...params, export: format })
  return `/api/reports/${kind}/?${query.toString()}`
}

export const mediaUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return path
}