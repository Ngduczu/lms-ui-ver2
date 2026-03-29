import { http } from '../lib/http';

export function getUsersApi(params = {}) {
  return http.get('/users', { params }).then((r) => r.data);
}

export function createUserApi(payload) {
  return http.post('/users', payload).then((r) => r.data);
}

export function updateUserApi(userId, payload) {
  return http.put('/users', { id: userId, ...payload }).then((r) => r.data);
}

export function updateUserStatusApi(userId, status) {
  return http.put(`/users/${userId}/status`, { status }).then((r) => r.data);
}

export function deleteUserApi(userId) {
  return http.delete(`/users/${userId}`).then((r) => r.data);
}

export function updateMyProfileApi(payload) {
  return http.put('/users/me', payload).then((r) => r.data);
}

export function changeMyPasswordApi(payload) {
  return http.put('/users/me/password', payload).then((r) => r.data);
}

export function uploadMyAvatarApi(file) {
  const formData = new FormData();
  formData.append('file', file);
  return http
    .post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}
