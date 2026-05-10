// endpoints.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const endpoints = {
  adminLogin: `${API_BASE}/api/admin/login`,
  adminLogout: `${API_BASE}/api/admin/logout`,
  adminMe: `${API_BASE}/api/admin/me`,
  adminContent: `${API_BASE}/api/admin/content`,
  adminReports: `${API_BASE}/api/admin/reports`,
  trackPageView: `${API_BASE}/api/activity/page-view`,
  adminRecentActivities: `${API_BASE}/api/activity/recent`,
  adminViewsPerDay: `${API_BASE}/api/activity/views-per-day`,
  adminViewsPerPage: `${API_BASE}/api/activity/views-per-page`
};