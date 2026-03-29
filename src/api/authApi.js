import { http } from '../lib/http';

export function loginApi(payload) {
  return http.post('/auth/login', payload).then((r) => r.data);
}

export function registerApi(payload) {
  return http.post('/auth/register', payload).then((r) => r.data);
}

export function getMyProfileApi() {
  return http.get('/users/me').then((r) => r.data);
}

export function forgotPasswordApi(payload) {
  return http.post('/auth/forgot-password', payload).then((r) => r.data);
}

export function resetPasswordApi(payload) {
  return http.post('/auth/reset-password', payload).then((r) => r.data);
}
