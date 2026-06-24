// dashboard.js
import { getCurrentAdmin, logoutAdmin, scheduleAdminSessionTimeout, redirectToAdminLogin } from "./auth.js";
import { apiFetch } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadRecentActivities() {
  try {
    const data = await apiFetch(endpoints.adminRecentActivities + "?limit=50");
    renderActivitiesTable(data.activities);
  } catch (error) {
    console.error("Failed to load activities:", error);
    const tbody = document.getElementById("activities-body");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5">Failed to load activities</td></tr>';
    }
  }
}

async function loadViewsPerPage() {
  try {
    const data = await apiFetch(endpoints.adminViewsPerPage);
    const tbody = document.getElementById("views-per-page-body");
    if (!tbody) return;

    if (!data.report || data.report.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No data available</td></tr>';
      return;
    }

    tbody.innerHTML = data.report
      .map(
        (row) => `
      <tr>
        <td>${escapeHtml(row.pageTitle || "-")}</td>
        <td>${escapeHtml(row.pagePath)}</td>
        <td>${escapeHtml(row.totalViews)}</td>
        <td>${escapeHtml(row.uniqueUsers)}</td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load views per page:", error);
    const tbody = document.getElementById("views-per-page-body");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4">Failed to load data</td></tr>';
    }
  }
}

async function loadViewsPerDay() {
  try {
    const data = await apiFetch(endpoints.adminViewsPerDay + "?days=7");
    renderViewsTable(data.report);
    updateSummary(data.summary);
  } catch (error) {
    console.error("Failed to load views report:", error);
    const tbody = document.getElementById("views-body");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="3">Failed to load data</td></tr>';
    }
  }
}

function renderActivitiesTable(activities) {
  const tbody = document.getElementById("activities-body");
  if (!tbody) return;

  if (!activities || activities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No activities yet</td></tr>';
    return;
  }

  tbody.innerHTML = activities
    .map((activity) => {
      const time = new Date(activity.timestamp).toLocaleString();
      const type = activity.activityType === "page_view" ? "Page View" : "Survey";
      const details =
        activity.activityType === "page_view"
          ? activity.pageTitle || activity.pagePath
          : activity.surveyName;

      return `
      <tr>
        <td>${escapeHtml(time)}</td>
        <td>${escapeHtml(type)}</td>
        <td>${escapeHtml(activity.submissionCode || "-")}</td>
        <td>${escapeHtml(activity.cohortCode || "-")}</td>
        <td>${escapeHtml(details)}</td>
      </tr>
    `;
    })
    .join("");
}

function renderViewsTable(report) {
  const tbody = document.getElementById("views-body");
  if (!tbody) return;

  if (!report || report.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
    return;
  }

  tbody.innerHTML = report
    .map(
      (day) => `
    <tr>
      <td>${escapeHtml(day.date)}</td>
      <td>${escapeHtml(day.totalViews)}</td>
      <td>${escapeHtml(day.uniqueUsers)}</td>
    </tr>
  `
    )
    .join("");
}

function updateSummary(summary) {
  if (!summary) return;

  const totalViews = document.getElementById("total-views");
  const avgViews = document.getElementById("avg-views");

  if (totalViews) {
    totalViews.textContent = summary.totalViews || 0;
  }

  if (avgViews) {
    avgViews.textContent = Math.round(summary.averageViewsPerDay || 0);
  }
}

async function initDashboard() {
  try {
    const data = await getCurrentAdmin();
    scheduleAdminSessionTimeout(data.admin);

    const adminName = document.getElementById("admin-name");
    if (adminName) {
      adminName.textContent = data.admin.username;
    }

    await Promise.all([loadRecentActivities(), loadViewsPerDay(), loadViewsPerPage()]);

    setInterval(loadRecentActivities, 30000);
  } catch {
    redirectToAdminLogin();
  }
}

const logoutButton = document.getElementById("logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await logoutAdmin();
    } finally {
      redirectToAdminLogin();
    }
  });
}

initDashboard();
