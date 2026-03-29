import { http } from '../lib/http';

export function getCourseMaterialsApi(courseId, params = {}) {
  return http.get(`/courses/${courseId}/materials`, { params }).then((r) => r.data);
}

export function uploadMaterialApi(courseId, materialForm) {
  const formData = new FormData();
  formData.append('name', materialForm.name);
  formData.append('type', materialForm.type);
  formData.append('file', materialForm.file);
  return http
    .post(`/courses/${courseId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    .then((r) => r.data);
}

export function updateMaterialStatusApi(materialId, status) {
  return http.put(`/materials/${materialId}/status`, { status }).then((r) => r.data);
}

export function deleteMaterialApi(materialId) {
  return http.delete(`/materials/${materialId}`).then((r) => r.data);
}

export function getMaterialDownloadUrlApi(materialId) {
  return http.get(`/materials/${materialId}/download`).then((r) => r.data);
}
