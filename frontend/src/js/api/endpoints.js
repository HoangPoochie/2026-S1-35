// endpoints.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const endpoints = {
  adminLogin: `${API_BASE}/api/admin/login`,
  adminLogout: `${API_BASE}/api/admin/logout`,
  adminMe: `${API_BASE}/api/admin/me`,
  adminChangePassword: "/api/admin/change-password",
  adminRecoverPassword: "/api/admin/recover-password",
  adminContent: `${API_BASE}/api/admin/content`,
  adminThemes: `${API_BASE}/api/admin/themes`,
  adminModules: `${API_BASE}/api/admin/modules`,
  adminUploads: `${API_BASE}/api/admin/uploads`,
  adminUploadImage: `${API_BASE}/api/admin/uploads/image`,
  adminUploadVideo: `${API_BASE}/api/admin/uploads/video`,
  adminReports: `${API_BASE}/api/admin/reports`,
  trackPageView: `${API_BASE}/api/activity/page-view`,
  adminRecentActivities: `${API_BASE}/api/activity/recent`,
  adminViewsPerDay: `${API_BASE}/api/activity/views-per-day`,
  adminViewsPerPage: `${API_BASE}/api/activity/views-per-page`
};
