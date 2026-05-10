import { apiFetch } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

export function getSubmissionCode() {
  return localStorage.getItem('submission_code') || null;
}

export function setSubmissionCode(code) {
  localStorage.setItem('submission_code', code);
}

export async function trackPageView(pageTitle) {
  try {
    const submissionCode = getSubmissionCode();
    const pagePath = window.location.pathname;
    const referrer = document.referrer;

    await apiFetch(endpoints.trackPageView, {
      method: 'POST',
      body: JSON.stringify({
        submissionCode,
        pagePath,
        pageTitle,
        referrer
      })
    });
  } catch (error) {
    console.error('Tracking error:', error);
  }
}
