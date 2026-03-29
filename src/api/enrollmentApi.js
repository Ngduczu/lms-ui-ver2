import { http } from '../lib/http';

export function getMyEnrollmentsApi(params = {}) {
  return http.get('/users/me/enrollments', { params }).then((r) => r.data);
}

export function getCourseEnrollmentsApi(courseId, params = {}) {
  return http.get(`/courses/${courseId}/enrollments`, { params }).then((r) => r.data);
}

export function requestEnrollmentApi(courseId) {
  return http.post(`/courses/${courseId}/enrollments`).then((r) => r.data);
}

export function updateEnrollmentStatusApi(courseId, userId, status) {
  return http
    .put(`/courses/${courseId}/enrollments/${userId}`, { status })
    .then((r) => r.data);
}

export function cancelMyEnrollmentApi(courseId) {
  return http.delete(`/courses/${courseId}/enrollments/me`).then((r) => r.data);
}
