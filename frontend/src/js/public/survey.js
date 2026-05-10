import { apiFetch } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';
import { setSubmissionCode } from '../utils/tracking.js';

export async function submitSurvey(surveyId, answers, cohortCode = null) {
  try {
    const response = await apiFetch(
      `${endpoints.adminReports}/../../surveys/${surveyId}/submissions`,
      {
        method: 'POST',
        body: JSON.stringify({
          cohortCode,
          answers
        })
      }
    );

    if (response.submissionCode) {
      setSubmissionCode(response.submissionCode);
    }

    return response;
  } catch (error) {
    console.error('Failed to submit survey:', error);
    throw error;
  }
}
