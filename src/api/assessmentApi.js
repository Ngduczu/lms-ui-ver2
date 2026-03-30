import { http } from '../lib/http';

export function getAssessmentsByCourseApi(courseId, params = {}) {
  return http.get('/assessments', { params: { courseId, ...params } }).then((r) => r.data);
}

export function getAssessmentDetailApi(assessmentId) {
  return http.get(`/assessments/${assessmentId}`).then((r) => r.data);
}

export function createAssessmentApi(payload) {
  return http.post('/assessments', payload).then((r) => r.data);
}

export function updateAssessmentApi(assessmentId, payload) {
  return http.patch(`/assessments/${assessmentId}`, payload).then((r) => r.data);
}

export function updateAssessmentStatusApi(assessmentId, status) {
  return http.patch(`/assessments/${assessmentId}/status`, { status }).then((r) => r.data);
}

export function deleteAssessmentApi(assessmentId) {
  return http.delete(`/assessments/${assessmentId}`).then((r) => r.data);
}

export function startAssessmentAttemptApi(assessmentId) {
  return http.post(`/assessments/${assessmentId}/attempts`).then((r) => r.data);
}

export function submitAssessmentAttemptApi(assessmentId, attemptId, payload) {
  return http.post(`/assessments/${assessmentId}/attempts/${attemptId}/submit`, payload).then((r) => r.data);
}

export function updateAssessmentAttemptViolationApi(assessmentId, attemptId, violationCount) {
  return http.patch(`/assessments/${assessmentId}/attempts/${attemptId}/violation`, { violationCount }).then((r) => r.data);
}

export function getMyAssessmentAttemptsApi(assessmentId) {
  return http.get(`/assessments/${assessmentId}/attempts/me`).then((r) => r.data);
}

export function getAssessmentAttemptsApi(assessmentId, params = {}) {
  return http.get(`/assessments/${assessmentId}/attempts`, { params }).then((r) => r.data);
}

export function getAssessmentAttemptDetailApi(assessmentId, attemptId) {
  return http.get(`/assessments/${assessmentId}/attempts/${attemptId}`).then((r) => r.data);
}

export function getAssessmentAttemptRankingsApi(assessmentId) {
  return http.get(`/assessments/${assessmentId}/attempts/rankings`).then((r) => r.data);
}
