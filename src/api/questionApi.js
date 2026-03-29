import { http } from '../lib/http';

export function getQuestionBanksApi(params = {}) {
  return http.get('/question-banks', { params }).then((r) => r.data);
}

export function createQuestionBankApi(payload) {
  return http.post('/question-banks', payload).then((r) => r.data);
}

export function updateQuestionBankApi(bankId, payload) {
  return http.put(`/question-banks/${bankId}`, payload).then((r) => r.data);
}

export function deleteQuestionBankApi(bankId) {
  return http.delete(`/question-banks/${bankId}`).then((r) => r.data);
}

export function getQuestionsByBankApi(bankId, params = {}) {
  return http.get(`/question-banks/${bankId}/questions`, { params }).then((r) => r.data);
}

export function createQuestionInBankApi(bankId, payload) {
  return http.post(`/question-banks/${bankId}/questions`, payload).then((r) => r.data);
}

export function updateQuestionInBankApi(bankId, questionId, payload) {
  return http.put(`/question-banks/${bankId}/questions/${questionId}`, payload).then((r) => r.data);
}

export function deleteQuestionInBankApi(bankId, questionId) {
  return http.delete(`/question-banks/${bankId}/questions/${questionId}`).then((r) => r.data);
}
