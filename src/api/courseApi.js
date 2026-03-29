import { http } from '../lib/http';

export function getCoursesApi(params = {}) {
  return http.get('/courses', { params }).then((r) => r.data);
}

export function getCourseByIdApi(courseId) {
  return http.get(`/courses/${courseId}`).then((r) => r.data);
}

export function createCourseApi(payload) {
  return http.post('/courses', payload).then((r) => r.data);
}

export function updateCourseApi(courseId, payload) {
  return http.put(`/courses/${courseId}`, payload).then((r) => r.data);
}

export function deleteCourseApi(courseId) {
  return http.delete(`/courses/${courseId}`).then((r) => r.data);
}
